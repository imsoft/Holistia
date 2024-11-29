import { currentUser } from "@clerk/nextjs/server";

const CategoryPage = async () => {
  const user = await currentUser();

  if (!user) {
    return <div>Por favor, inicia sesión para acceder a esta página.</div>;
  }

  return <div>Bienvenido {user.firstName}</div>;
};

export default CategoryPage;
