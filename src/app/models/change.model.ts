import { Calendar } from "./calendar.model";

export interface Change {
    date: Date;
    user: string;
    calendar: string;
    previousState: Partial<Calendar>;
    newState: Partial<Calendar>;
    isDeleted: boolean;
    _id?: string;
}