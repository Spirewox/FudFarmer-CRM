import { ValidCompensationStatus, ValidCompensationType } from "@/interface/compensation.interface";
import { CustomerSegmentType, ICustomer, ValidCustomerType } from "@/interface/customer.interface";
import { ValidEnquiryStatus } from "@/interface/enquiry.interface";
import { ValidFeedBackSentiment, ValidFeedBackStatus, ValidFeedbackTypes } from "@/interface/feedback.interface";
import { axiosGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";


export interface CustomerOverview {
  _id: string;
  customer_name: string;
  company_name : string;
  customer_phone : string;
  customer_type : ValidCustomerType;
  customer_email: string;
  customer_location: string;
  segments: CustomerSegmentType[];
  added_by : string;
  createdAt : Date

  total_orders: number;
  total_order_cost: number;

  feedbacks: CustomerFeedbackOverview[];
  recent_enquiries: CustomerEnquiryOverview[];
  compensations: CustomerCompensationOverview[];
}

export interface CustomerFeedbackOverview {
  type: ValidFeedbackTypes;
  sentiment: ValidFeedBackSentiment;
  status: ValidFeedBackStatus;
  content : string;
  createdAt : Date
}


export interface CustomerEnquiryOverview {
  subject: string;
  status: ValidEnquiryStatus;
  date : Date 
}


export interface CustomerCompensationOverview {
  category: ValidCompensationType;
  value: number;
  status: ValidCompensationStatus;
  reason : string;
  createdAt : Date;
}


export interface OverviewRes {
    data: CustomerOverview[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const fetchCustomersOverview = async (params : {customer_type ?: string, customer_location ?: string, search : string, page : number, limit : number}) => {
  const queryParams = new URLSearchParams();
  if(params.search) queryParams.append("search", params.search);
  if(params.customer_location) queryParams.append("customer_location", params.customer_location);
  if(params.customer_type) queryParams.append("customer_type", params.customer_type);
  if(params.page) queryParams.append("page", String(params.page));
  if(params.limit) queryParams.append("limit", String(params.limit));

  const response = await axiosGet(`customers/overview?${queryParams.toString()}`, true);
  return response as OverviewRes;
};

export const useCustomerOverview = (params :{customer_type ?: string, customer_location ?: string, search : string, page : number, limit : number}) => {
  return useQuery({
    queryKey: ["customer-overview",params.customer_location,params.search,params.customer_type, params.page, params.limit],
    queryFn: ()=>fetchCustomersOverview(params),
    retry : false,
  });
};


const fetchCustomersList = async (params : {customer_type ?: string, customer_location ?: string, search ?: string}) => {
  const queryParams = new URLSearchParams();
  if(params.search) queryParams.append("search", params.search);
  if(params.customer_type) queryParams.append("customer_type", params.customer_type);
  if(params.customer_location) queryParams.append("customer_location", params.customer_location);

  const response = await axiosGet(`customers?${queryParams.toString()}`, true);
  return response as ICustomer[];
};

export const useCustomerList = (params ?:{customer_type ?: string, customer_location ?: string, search ?: string}) => {
  return useQuery({
    queryKey: ["customer-list",params?.customer_location,params?.search,params?.customer_type],
    queryFn: ()=>fetchCustomersList(params),
    retry : false,
  });
};


const fetchCustomerLocation = async () => {
  const response = await axiosGet(`customers/locations`, true);
  return response as string[];
};


export const useCustomerLocations = () => {
  return useQuery({
    queryKey: ["customer-locations"],
    queryFn: ()=>fetchCustomerLocation(),
    retry : false,
  });
};