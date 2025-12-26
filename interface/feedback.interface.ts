import { ICustomer } from "./customer.interface";

export enum ValidFeedbackTypes {
    complaint = "complaint",
    suggestion = "suggestion",
    appreciation = "appreciation"
}

export enum ValidFeedBackStatus{
    open = "open",
    resolved = "resolved"
}

export enum ValidFeedBackSentiment{
    neutral = "neutral",
    negative = "negative",
    positive = "positive"
}

export interface IFeedback {
    _id ?: string
  customer ?: string | ICustomer;
  type ?: ValidFeedbackTypes;
  sentiment ?: ValidFeedBackSentiment;
  content ?: string;
  resolution?: string;
  resolution_date ?: Date;
  status ?: ValidFeedBackStatus;
  createdAt ?: Date;

}
