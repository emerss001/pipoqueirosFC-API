import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Semeando banco de dados local com usuário desenvolvedor...");
  
  /*
   * Criei esse token e usuário fake para facilitar os testes locais.
   * Como o app ainda não tem tela de login/cadastro e abre direto na home,
   * a gente injeta esse token no app e salva ele aqui no banco. Assim as rotas protegidas
   * da API funcionam de primeira sem bo no desenvolvimento local.
   */
  const userId = "dev-user-id";
  const userEmail = "dev@pipoqueiros.com";
  const userName = "Desenvolvedor Local";
  const token = "dev-token-xyz";

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      id: userId,
      email: userEmail,
      name: userName,
      role: "USER",
    },
  });

  await prisma.session.upsert({
    where: { token: token },
    update: {
      expiresAt: new Date("2030-01-01T00:00:00Z"),
    },
    create: {
      id: "dev-session-id",
      token: token,
      userId: user.id,
      expiresAt: new Date("2030-01-01T00:00:00Z"),
    },
  });

  console.log("Semeado com sucesso!");
  console.log(`User ID: ${user.id}`);
  console.log(`Session Token: ${token}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
