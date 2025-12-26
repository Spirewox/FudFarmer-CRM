import { ICustomer } from "./customer.interface";

export enum ValidCompensationType{
    product = "product",
    merch = "merch",
    voucher = "voucher",
    refund = "refund"
}

export enum ValidCompensationStatus {
    pending = "pending",
    approved = "approved",
    paid_issued = "paid/issued"

}


export interface ICompensation {
  _id?: string;

  customer ?: string | ICustomer;

  category ?: ValidCompensationType;

  reason ?: string;

  value ?: number;

  status ?: ValidCompensationStatus;

  createdAt?: Date;
  updatedAt?: Date;
}