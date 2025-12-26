export enum ValidEnquiryStatus{
    open = "open",
    closed = "closed"
}


export interface IEnquiry {
    _id ?: string
  customer_name ?: string;
  customer_email ?: string;
  date ?: Date;
  subject ?: string;
  message ?: string;
  resolution?: string;
  status ?: ValidEnquiryStatus;
}