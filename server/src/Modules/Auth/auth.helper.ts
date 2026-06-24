import { Users } from "./auth.shema";

export const validateEmail = async (email: string) => {
  try {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw { status: 400, message: "Invalid email" };
    }
    let [emailExists] = await Users.find({ email });
    if (emailExists) {
      throw { status: 400, message: "Email already exists" };
    }
    return email;
  } catch (error) {
    throw error;
  }
};

export const validatePassword = async (password: string) => {
  try {
    if (password.length < 8) {
      throw { status: 400, message: "Password must be at least 8 characters long" };
    }
    return password;
  } catch (error) {
        throw error;
    }
};

export const validateName = async (name: string) => {
    try {
        if (name.length < 3) {
            throw { status: 400, message: "Name must be at least 3 characters long" };
        }
        return name;
    } catch (error) {
        throw error;
    }
};