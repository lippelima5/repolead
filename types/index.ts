import { Prisma, user } from "@/prisma/generated/client"


export type WorkspaceUserRelations = Prisma.workspace_userGetPayload<{
    include: {
        user: true,
        workspace: true,
    }
}>

export type WorkspaceRelations = Prisma.workspaceGetPayload<{
    include: {
        users: {
            include: {
                user: true
            }
        },
        _count: true,
    }
}>

export type SanitizedUser = Omit<user,
    | 'password'
    | 'reset_token'
    | 'reset_token_expires_at'
    | 'verification_token'
    | 'verification_token_expires_at'
>;

export type ContactData = {
    name: string,
    position: string | null,
    company: string | null,
    email: string,
    phone: string,
    message: string | null,
}
