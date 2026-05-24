import { useSignIn } from '@clerk/expo'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'

type SignInFieldErrors = {
  identifier?: string
  password?: string
  code?: string
  form?: string
}

type MfaStrategy = 'email_code' | 'phone_code'

type ClerkErrorItem = {
  message?: string
  longMessage?: string
  meta?: {
    paramName?: string
  }
}

type ClerkErrorResponse = {
  errors?: ClerkErrorItem[]
  message?: string
  longMessage?: string
}

const clerkFieldMap: Record<string, keyof SignInFieldErrors> = {
  code: 'code',
  email_address: 'identifier',
  emailAddress: 'identifier',
  identifier: 'identifier',
  password: 'password',
  verification_code: 'code',
}

function getClerkMessage(error: ClerkErrorItem) {
  return error.longMessage || error.message || 'Something went wrong. Please try again.'
}

function mapClerkErrors(error: unknown): SignInFieldErrors {
  const nextErrors: SignInFieldErrors = {}
  const clerkError = error as ClerkErrorResponse

  if (Array.isArray(clerkError.errors)) {
    clerkError.errors.forEach((item) => {
      const field = item.meta?.paramName ? clerkFieldMap[item.meta.paramName] : undefined
      const message = getClerkMessage(item)

      if (field) {
        nextErrors[field] = message
      } else if (!nextErrors.form) {
        nextErrors.form = message
      }
    })
  }

  if (!Object.keys(nextErrors).length) {
    nextErrors.form = clerkError.longMessage || clerkError.message || 'Something went wrong. Please try again.'
  }

  return nextErrors
}

export default function SignIn() {
  const { signIn, fetchStatus } = useSignIn()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [mfaStrategy, setMfaStrategy] = useState<MfaStrategy | null>(null)
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({})

  const isLoading = fetchStatus === 'fetching'
  const isVerifyingCode =
    signIn.status === 'needs_second_factor' ||
    signIn.status === 'needs_client_trust'

  const clearFieldError = (field: keyof SignInFieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field] && !current.form) {
        return current
      }

      return {
        ...current,
        [field]: undefined,
        form: undefined,
      }
    })
  }

  const finalizeSignIn = async () => {
    const { error } = await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session.currentTask) {
          console.log(session.currentTask)
          return
        }

        const url = decorateUrl('/')
        router.replace(url as any)
      },
    })

    if (error) {
      console.log(JSON.stringify(error, null, 2))
      setFieldErrors(mapClerkErrors(error))
      return false
    }

    setFieldErrors({})
    return true
  }

  const startMfaChallenge = async () => {
    const emailCodeFactor = signIn.supportedSecondFactors.find(
      (factor) => factor.strategy === 'email_code'
    )
    const phoneCodeFactor = signIn.supportedSecondFactors.find(
      (factor) => factor.strategy === 'phone_code'
    )

    if (signIn.status === 'needs_client_trust' && emailCodeFactor) {
      const { error } = await signIn.mfa.sendEmailCode()

      if (error) {
        console.log(JSON.stringify(error, null, 2))
        setFieldErrors(mapClerkErrors(error))
        return
      }

      setCode('')
      setMfaStrategy('email_code')
      setFieldErrors({})
      return
    }

    if (signIn.status === 'needs_second_factor' && phoneCodeFactor) {
      const { error } = await signIn.mfa.sendPhoneCode()

      if (error) {
        console.log(JSON.stringify(error, null, 2))
        setFieldErrors(mapClerkErrors(error))
        return
      }

      setCode('')
      setMfaStrategy('phone_code')
      setFieldErrors({})
      return
    }

    if (signIn.status === 'needs_second_factor' && emailCodeFactor) {
      const { error } = await signIn.mfa.sendEmailCode()

      if (error) {
        console.log(JSON.stringify(error, null, 2))
        setFieldErrors(mapClerkErrors(error))
        return
      }

      setCode('')
      setMfaStrategy('email_code')
      setFieldErrors({})
      return
    }

    setFieldErrors({ form: 'This account requires a sign-in method that is not supported yet.' })
  }

  const onSignInPress = async () => {
    const { error } = await signIn.password({
      identifier: email.trim(),
      password,
    })

    if (error) {
      console.log(JSON.stringify(error, null, 2))
      setFieldErrors(mapClerkErrors(error))
      return
    }

    if (signIn.status === 'complete') {
      await finalizeSignIn()
    } else if (
      signIn.status === 'needs_second_factor' ||
      signIn.status === 'needs_client_trust'
    ) {
      await startMfaChallenge()
    } else {
      console.error('Sign-in attempt not complete:', signIn)
      setFieldErrors({ form: 'Sign-in needs another step that is not supported yet.' })
    }
  }

  const onVerifyPress = async () => {
    if (!code.trim()) {
      setFieldErrors({ code: 'Verification code is required.' })
      return
    }

    const { error } =
      mfaStrategy === 'phone_code'
        ? await signIn.mfa.verifyPhoneCode({ code: code.trim() })
        : await signIn.mfa.verifyEmailCode({ code: code.trim() })

    if (error) {
      console.log(JSON.stringify(error, null, 2))
      setFieldErrors(mapClerkErrors(error))
      return
    }

    if (signIn.status === 'complete') {
      await finalizeSignIn()
    } else {
      console.error('Sign-in attempt not complete:', signIn)
      setFieldErrors({ form: 'Sign-in attempt is not complete yet.' })
    }
  }

  if (isVerifyingCode) return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        bottomOffset={12}
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          <Image
            source={require('../../assets/images/realstate.png')}
            className="w-32 h-24 mb-8"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            Verify Sign In
          </Text>
          <Text className="text-gray-500 mb-8">
            Enter the verification code to continue.
          </Text>
          <TextInput
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
            placeholder="Verification Code"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            autoCapitalize="none"
            value={code}
            onChangeText={(value) => {
              setCode(value)
              clearFieldError('code')
            }}
          />
          {fieldErrors.code && (
            <Text className="text-red-500 text-sm mb-4">
              {fieldErrors.code}
            </Text>
          )}
          <TouchableOpacity onPress={onVerifyPress} disabled={isLoading} className="w-full bg-blue-600 rounded-xl items-center py-4 mb-4">
            {
              isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Verify
                </Text>
              )
            }
          </TouchableOpacity>
          {fieldErrors.form && (
            <Text className="text-red-500 text-sm mb-4">
              {fieldErrors.form}
            </Text>
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        bottomOffset={12}
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          <Image
            source={require('../../assets/images/realstate.png')}
            className="w-32 h-24 mb-8"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            Welcome Back
          </Text>
          <Text className="text-gray-500 mb-8">
            Sign in to continue finding your next home.
          </Text>
          <TextInput
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(value) => {
              setEmail(value)
              clearFieldError('identifier')
            }}
          />
          {fieldErrors.identifier && (
            <Text className="text-red-500 text-sm mb-4">
              {fieldErrors.identifier}
            </Text>
          )}
          <TextInput
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6"
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={(value) => {
              setPassword(value)
              clearFieldError('password')
            }}
          />
          {fieldErrors.password && (
            <Text className="text-red-500 text-sm mb-4">
              {fieldErrors.password}
            </Text>
          )}
          <TouchableOpacity onPress={onSignInPress} disabled={isLoading} className="w-full bg-blue-600 rounded-xl items-center py-4 mb-4">
            {
              isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Sign In
                </Text>
              )
            }
          </TouchableOpacity>
          {fieldErrors.form && (
            <Text className="text-red-500 text-sm mb-4">
              {fieldErrors.form}
            </Text>
          )}
          <View className="flex-row justify-center" >
            <Text className="text-gray-500">No account yet?</Text>
            <Link href="/sign-up" className="text-blue-600 font-semibold ml-1">
              Sign Up
            </Link>
          </View>
          <View nativeID="clerk-captcha" />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}
