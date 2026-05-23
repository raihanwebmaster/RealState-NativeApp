import { useAuth, useSignUp } from '@clerk/expo'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'

type SignUpFieldErrors = {
  emailAddress?: string
  password?: string
  code?: string
  form?: string
}

type ClerkErrorItem = {
  code?: string
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

const clerkFieldMap: Record<string, keyof SignUpFieldErrors> = {
  email_address: 'emailAddress',
  emailAddress: 'emailAddress',
  password: 'password',
  code: 'code',
  verification_code: 'code',
}

function getClerkMessage(error: ClerkErrorItem) {
  return error.longMessage || error.message || 'Something went wrong. Please try again.'
}

function mapClerkErrors(error: unknown): SignUpFieldErrors {
  const nextErrors: SignUpFieldErrors = {}
  const clerkError = error as ClerkErrorResponse

  if (Array.isArray(clerkError.errors)) {
    clerkError.errors.forEach((item) => {
      const field = item.meta?.paramName
        ? clerkFieldMap[item.meta.paramName]
        : item.code?.includes('verification') || item.code?.includes('code')
          ? 'code'
          : undefined
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

export default function SignUP() {
  const { signUp, fetchStatus } = useSignUp()
  const { isSignedIn } = useAuth()

  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({})
  const [code, setCode] = useState('')

  const isLoading = fetchStatus === 'fetching'
  const isVerifyingEmail =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address')

  if (signUp.status === 'complete' || isSignedIn) {
    return null
  }

  const clearFieldError = (field: keyof SignUpFieldErrors) => {
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

  const onSignUpPress = async () => {

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    })

    if (error) {
      console.log(JSON.stringify(error, null, 2))
      setFieldErrors(mapClerkErrors(error))

      return
    }

    setFieldErrors({})

    const { error: verificationError } = await signUp.verifications.sendEmailCode()

    if (verificationError) {
      console.log(JSON.stringify(verificationError, null, 2))
      setFieldErrors(mapClerkErrors(verificationError))
      return
    }

  }

  const onVerifyEmailPress = async () => {
    if (!code.trim()) {
      setFieldErrors({ code: 'Verification code is required.' })
      return
    }

    const { error } = await signUp.verifications.verifyEmailCode({
      code: code.trim(),
    })

    if (error) {
      console.log(JSON.stringify(error, null, 2))
      setFieldErrors(mapClerkErrors(error))
      return
    }

    const { error: finalizeError } = await signUp.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl('/')
        router.replace(url as any)
      }
    })

    if (finalizeError) {
      console.log(JSON.stringify(finalizeError, null, 2))
      setFieldErrors(mapClerkErrors(finalizeError))
      return
    }

    setFieldErrors({})
  }

  const onResendCodePress = async () => {
    const { error } = await signUp.verifications.sendEmailCode()

    if (error) {
      console.log(JSON.stringify(error, null, 2))
      setFieldErrors(mapClerkErrors(error))
      return
    }

    setFieldErrors({})
  }

  const onStartOverPress = async () => {
    const { error } = await signUp.reset()

    if (error) {
      setFieldErrors(mapClerkErrors(error))
      return
    }

    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setCode('')
    setFieldErrors({})
  }

  if (isVerifyingEmail) return (
    <View className="flex-1 justify-center px-6 py-12">
      <Image
        source={require('../../assets/images/realstate.png')}
        className="w-32 h-24 mb-8"
        resizeMode="contain"
      />
      <Text className="text-3xl font-bold text-gray-800 mb-2">
        Verify Your Email
      </Text>
      <Text className="text-gray-500 mb-8">
        We sent a code to {signUp.emailAddress}. Enter it below to complete your sign up.
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
      {
        fieldErrors.code && (
          <Text className="text-red-500 text-sm mb-4">
            {fieldErrors.code}
          </Text>
        )
      }
      <TouchableOpacity onPress={onVerifyEmailPress} disabled={isLoading} className="w-full bg-blue-600 rounded-xl items-center py-4 mb-4">
        {
          isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">
              Verify Email
            </Text>
          )
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={onResendCodePress} disabled={isLoading} className="py-2">
        <Text className="text-blue-600 font-semibold">
          I need a new code
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onStartOverPress} disabled={isLoading} className="py-2">
        <Text className="text-gray-600 font-medium">
          Use a different email
        </Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-white"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-6 py-12">
        <Image
          source={require('../../assets/images/realstate.png')}
          className="w-32 h-24 mb-8"
          resizeMode="contain"
        />
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Create an Account
        </Text>
        <Text className="text-gray-500 mb-8">
          Find your dream home with our easy-to-use platform.
        </Text>
        <View className="flex-row gap-3 mb-4">
          <TextInput
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
            placeholder="First Name"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
            placeholder="Last Name"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(value) => {
            setEmail(value)
            clearFieldError('emailAddress')
          }}
        />
        {fieldErrors.emailAddress && (
          <Text className="text-red-500 text-sm mb-4">
            {fieldErrors.emailAddress}
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
        <TouchableOpacity onPress={onSignUpPress} disabled={isLoading} className="w-full bg-blue-600 rounded-xl items-center py-4 mb-4">
          {
            isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Sign Up
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
          <Text className="text-gray-500">Already have an account?</Text>
          <Link href="/sign-in" className="text-blue-600 font-semibold ml-1">
            Sign In
          </Link>
        </View>
        <View nativeID="clerk-captcha" />
      </View>
    </ScrollView>
  )
}
