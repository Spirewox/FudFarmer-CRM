import { ValidOrderType } from "./order.interface";

export enum ValidCustomerType {
    b2c = "b2c",
    b2b = "b2b"
}

export const CustomerSegment = [
  "B2B - Restaurant",
  "B2B - Caterer",
  "B2C - Home Cook",
  "B2C - Student",
  "Lagos - Retail",
  "Ife - Wholesale"
] as const;

export type CustomerSegmentType = typeof CustomerSegment[number];


export interface ICustomer {
  _id : string;
  customer_type: ValidCustomerType;
  company_name : string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_location: string;
  order_volume ?: number;
  order_amount ?: number;
  order_type ?: ValidOrderType;
  assigned_agent: string;
  added_by: string;
  segments: CustomerSegmentType[];
}