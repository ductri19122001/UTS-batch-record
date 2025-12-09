import type { User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { UserRole } from "@prisma/client";

const prisma = new PrismaClient()

interface Auth0UserData {
  email: string;
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export async function fetchUsersFromDB(): Promise<User[]> {
  const profiles: User[] = await prisma.user.findMany()
  return profiles
}

export async function addUserToDB(data: any): Promise<User> {
  // console.log(data)  
  const profile: User = await prisma.user.create({ data })
  console.log("Sucessfully added profile to database")
  return profile
}

export async function upsertUserFromAuth0(data: Auth0UserData): Promise<User> {
  const profile: User = await prisma.user.upsert({
    where: {
      id: data.id
    },
    update: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role
    },
    create: {
      id: data.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    },
  })

  return profile
}

export async function activateUserDB(id: string): Promise<User> {
  const profile: User = await prisma.user.update({
    data: { isActive: true },
    where: { id: id }
  })
  return profile
}
export async function deactivateUserDB(id: string): Promise<User> {
  const profile: User = await prisma.user.update({
    data: { isActive: false },
    where: { id: id }
  })
  return profile
}

export async function deleteUserFromDB(id: string): Promise<User> {
  const profile: User = await prisma.user.delete({
    where: {
      id: id
    }
  })
  return profile
}

export async function fetchUserByIdFromDB(id: string): Promise<User | null> {
  const profile: User | null = await prisma.user.findUnique({
    where: {
      id: id
    }
  })
  return profile
}

// export async function editUser(user: User): Promise<User | null> {
//   const profile = User | null await = prisma.user.update({{ user } where: { id: user.id }})
// return profile
// }
