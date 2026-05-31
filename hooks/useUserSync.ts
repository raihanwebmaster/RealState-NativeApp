import { useUserStore } from "@/store/userStore";
import { useAuth, useUser } from "@clerk/expo";
import { useEffect } from "react";
import { useSupabase } from "./useSuperbase";

export const useUserSync = () => {
  const { isLoaded: authLoaded, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const setIsAdmin = useUserStore((state) => state.setIsAdmin);
  const setIsAdminLoading = useUserStore((state) => state.setIsAdminLoading);
  const authSupabase = useSupabase();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const firstName = user?.firstName ?? null;
  const lastName = user?.lastName ?? null;
  const avatarUrl = user?.imageUrl ?? null;
  
  useEffect(() => {
    let isActive = true;

    const syncUser = async () => {
      if (!authLoaded) {
        return;
      }

      if (!userId) {
        setIsAdmin(false);
        setIsAdminLoading(false);
        return;
      }

      if (!userLoaded) {
        return;
      }

      setIsAdminLoading(true);
      setIsAdmin(false);

      try {
        const { data, error } = await authSupabase
          .from("users")
          .select("clerk_id, is_admin")
          .eq("clerk_id", userId)
          .maybeSingle();

        if (!isActive) {
          return;
        }

        if (error) {
          console.error("Error fetching user data:", error);
          setIsAdmin(false);
          return;
        }

        if (data) {
          setIsAdmin(data.is_admin ?? false);
          return;
        }

        const { data: newUser, error: createError } = await authSupabase
          .from("users")
          .insert({
            clerk_id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
          })
          .select("is_admin")
          .single();

        if (!isActive) {
          return;
        }

        if (createError) {
          console.error("Error creating user:", createError);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(newUser?.is_admin ?? false);
      } finally {
        if (isActive) {
          setIsAdminLoading(false);
        }
      }
    };

    void syncUser();

    return () => {
      isActive = false;
    };
  }, [authLoaded,userId,userLoaded]);
};
