export const DEFAULT_SCHEMA = `
model User {
  id     Int     @id
  name   String
  posts  Post[]
}

model Post {
  id        Int  @id
  authorId  Int
  author    User  @relation(fields: [authorId], references: [id])
}
`.trim();

export const DEFAULT_CODE = `
import { PrismaClient } from '@prisma/client'
			
const prisma = new PrismaClient();

const main = async () => {
  const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .catch(e => console.log(e))
  .finally(() => prisma.disconnect())
`.trim();
