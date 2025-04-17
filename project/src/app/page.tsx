import { cookies } from "next/headers";

const HomePage = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");
  if (token) {
    return <>Home page</>;
  }
  return <></>
};

export default HomePage;
