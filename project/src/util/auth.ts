import axios from "axios";
import { auth, provider, signInWithPopup } from "./firebase";
import { BACKEND_URL } from "./config";

export type LoginInputs = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
};

export type RegisterInputs = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export const login = async (inputs: LoginInputs) => {
  try {
    const res = await axios.post(BACKEND_URL + "/api/auth/login", inputs);
    if (res.data.accessToken) {
      document.cookie = `accessToken=${res.data.accessToken}; path=/`;
      return true
    }
    return false
  } catch (err) {
    console.error("Login failed", err);
    return false
  }
};

export const register = async (inputs: RegisterInputs) => {
  try {
    const res = await axios.post(BACKEND_URL + "/api/auth/register", inputs);
    if (res.data.accessToken) {
      document.cookie = `accessToken=${res.data.accessToken}; path=/`;
      return true;
    }
    return false;
  } catch (err) {
    console.error("Login failed", err);
    return false;
  }
};

export const googleSignIn = async () => {
  try {
    const googleAccount = await signInWithPopup(
      auth,
      provider.setCustomParameters({ prompt: "select_account" })
    );
    const user = googleAccount.user;

    const inputs = {
      email: user.email,
      name: user.displayName,
      profile_img_src: user.photoURL,
    };

    const res = await axios.post(BACKEND_URL + "/api/auth/google", inputs, {
      withCredentials: true,
    });

    if (res.data.accessToken) {
      document.cookie = `accessToken=${res.data.accessToken}; path=/`;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Login Error:", error);
    return false;
  }
};
