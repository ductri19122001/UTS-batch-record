export type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive?: boolean;
    password?: string;
    confirmPassword?: string;
    createdAt?: Date;
    updatedAt?: Date;
}