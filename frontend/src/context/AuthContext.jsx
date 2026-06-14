import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from Supabase session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          mapSupabaseUser(session.user);
        }
      } catch (e) {
        console.error("Supabase auth error:", e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        mapSupabaseUser(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const mapSupabaseUser = (sbUser) => {
    if (!sbUser) return;
    setUser({
      id: sbUser.id,
      email: sbUser.email,
      fullName: sbUser.user_metadata?.fullName || "Lawyer",
      barCouncilId: sbUser.user_metadata?.barCouncilId || "",
      stateBarCouncil: sbUser.user_metadata?.stateBarCouncil || "",
      specialization: sbUser.user_metadata?.specialization || ""
    });
    setIsAuthenticated(true);
  };

  const register = async (userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            fullName: userData.fullName,
            barCouncilId: userData.barCouncilId || "",
            stateBarCouncil: userData.stateBarCouncil || "",
            specialization: userData.specialization || ""
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If email confirmation is required, session might be null.
      // But usually in test environments it logs in immediately.
      if (data.session) {
        mapSupabaseUser(data.session.user);
      } else {
        return { success: true, message: "Registration successful. Please check your email to verify your account." };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      mapSupabaseUser(data.session.user);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const getInitials = () => {
    if (!user?.fullName) return "U";
    const parts = user.fullName.replace(/^(Adv\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, "").trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, register, login, logout, getInitials }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
