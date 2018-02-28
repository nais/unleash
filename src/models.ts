export interface User {
    name: string;
    email: string;
    imageUrl: string;
}

export interface RequestWithUser extends Request {
    session: {
        authedUser?: User;
    }
    user?: User;
}
