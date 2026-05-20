import { AuthSessionPayload } from "./auth.types";

export const setAuthSession = async (
  payload: AuthSessionPayload,
): Promise<boolean> => {
  try {
    const requestOptions = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${payload.token}`,
      },
    };
    const response = await fetch("/api/session", requestOptions);

    if (!response.ok) {
      throw new Error("Failed to fetch bridge state.");
    }

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const endAuthSession = async () => {
  try {
    const response = await fetch("/api/session", {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to clear auth session.");
    }

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
