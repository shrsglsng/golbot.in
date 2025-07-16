import axios from "axios";
import { UserModel } from "../models/userModel";
import { updateToken } from "../redux/userSlice";

export async function sendOtp(phone: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SERVER_URL) throw "Server Url Not Set";
    const url = process.env.NEXT_PUBLIC_SERVER_URL + "/auth/sendOTP";

    var res = await axios.post(url, { phone });

    if (res.status !== 200) return false;
  } catch (error) {
    return false;
  }

  return true;
}

export async function verifyOtp(
  phone: string,
  OTP: string,
  dispatch: any
): Promise<UserModel | undefined> {
  var user: UserModel | undefined = undefined;

  if (!process.env.NEXT_PUBLIC_SERVER_URL) throw "Server Url Not Set";
  const url = process.env.NEXT_PUBLIC_SERVER_URL + "/auth/verifyOTP";

  try {
    var res = await axios.post(url, { phone, OTP });

    if (res.status !== 200) return undefined;

    user = {
      ...res.data.user,
      token: res.data.token,
    };

    localStorage.setItem("Token", res.data.token);
    dispatch(updateToken({ token: user?.token }));
  } catch (error) {
    console.log(error);
  }

  return user;
}
