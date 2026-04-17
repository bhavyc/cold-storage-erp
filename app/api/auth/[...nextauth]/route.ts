// import NextAuth, { NextAuthOptions } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { prisma } from "@/lib/prisma";
// import bcrypt from "bcryptjs";

// export const authOptions: NextAuthOptions = {
//   adapter: PrismaAdapter(prisma) as any,
//   session: { strategy: "jwt" },
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         username: { label: "Username", type: "text" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         if (!credentials?.username || !credentials?.password) return null;
//         const user = await prisma.user.findUnique({ where: { username: credentials.username } });
//         if (!user || !user.status) throw new Error("User not found or disabled");
        
//         // Ensure you hash passwords when creating users!
//         const isMatch = await bcrypt.compare(credentials.password, user.password);
//         if (!isMatch) throw new Error("Invalid password");
        
//         return { id: user.id, name: user.name, role: user.role };
//       }
//     })
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) token.role = (user as any).role;
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user) (session.user as any).role = token.role;
//       return session;
//     }
//   }
// };

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };