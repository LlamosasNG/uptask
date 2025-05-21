import { isAxiosError } from "axios";
import api from "@/lib/axios";
import {
  ConfirmToken,
  RequestConfirmationCodeForm,
  UserLoginForm,
  UserRegistrationForm,
} from "../types";

export async function createAccount(formData: UserRegistrationForm) {
  try {
    const { data } = await api.post("/auth/create-account", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function confirmAccount(formData: ConfirmToken) {
  try {
    const { data } = await api.post("/auth/confirm-account", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function requestConfirmationCode(
  formData: RequestConfirmationCodeForm
) {
  try {
    const { data } = await api.post("/auth/request-code", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function login(formData: UserLoginForm) {
  try {
    const { data } = await api.post("/auth/login", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}
