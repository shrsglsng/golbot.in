import axios from "axios";
import { UserModel } from "../models/userModel";
import { updateToken } from "../redux/userSlice";

/**
 * Send OTP to the user's phone number
 */
export async function sendOtp(phone: string): Promise<boolean> {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) throw new Error("Server URL not set");

    const url = `${serverUrl}/auth/send-otp`;
    const res = await axios.post(url, { phone });

    return res.status === 200;
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return false;
  }
}

/**
 * Verify OTP and return the user object on success
 */
export async function verifyOtp(
  phone: string,
  otp: string,
  dispatch: any
): Promise<UserModel | undefined> {
  let user: UserModel | undefined;

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!serverUrl) throw new Error("Server URL not set");

  const url = `${serverUrl}/auth/verify-otp`;

  try {
    console.log("Verifying OTP for phone:", phone, "OTP:", otp);
    const res = await axios.post(url, { phone, otp });

    if (res.status !== 200) {
      console.warn("OTP verification failed with status:", res.status);
      return undefined;
    }

    user = {
      ...res.data.data.user,
      token: res.data.data.token,
    };

    if (user?.token) {
      localStorage.setItem("Token", user.token);
      dispatch(updateToken({ token: user.token }));
    }
  } catch (error) {
    console.error("OTP verification failed:", error);
  }

  return user;
}