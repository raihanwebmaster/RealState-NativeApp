import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { useEffect } from "react";
import { useSupabase } from "./useSuperbase";

export const useUserSync = () => {
  const { isLoaded, user } = useUser();
  const authSupabase = useSupabase();
  const setIsAdmin = useUserStore((state) => state.setIsAdmin);
  const setIsAdminLoading = useUserStore((state) => state.setIsAdminLoading);

  useEffect(() => {
    let isActive = true;

    const syncUser = async () => {
      if (!isLoaded) {
        return;
      }

      setIsAdminLoading(true);
      setIsAdmin(false);

      if (!user) {
        setIsAdminLoading(false);
        return;
      }

      try {
        const { data, error } = await authSupabase
          .from("users")
          .select("clerk_id, is_admin")
          .eq("clerk_id", user.id)
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
            clerk_id: user.id,
            email: user.emailAddresses[0]?.emailAddress ?? "",
            first_name: user.firstName,
            last_name: user.lastName,
            avatar_url: user.imageUrl,
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
  }, [authSupabase, isLoaded, setIsAdmin, setIsAdminLoading, user]);
};
