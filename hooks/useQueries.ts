import { IUser } from "@/contexts/AuthContext";
import { axiosGet } from "../lib/api";
import {  useQuery } from "@tanstack/react-query";


// Fetcher
const fetchWhoAmI = async () => {
  const response = await axiosGet("auth/whoami", true);

  return response.data;
};

// Custom hook
export const useWhoAmI = () => {
  return useQuery({
    queryKey: ["whoami"], // cache key
    queryFn: fetchWhoAmI,
    placeholderData : (prev)=> prev,
    retry : false,
  });
};

export interface DashMetRes {
  "totalCustomers": number,
  "activeLeads": number,
  "pipelineValue": number,
  "openComplaints": number,
  "customersByLocation":     { "name": string, "customers": number }[],
  "feedbackBreakdown": { "name": string, "value": number }[],
}

const fetchDashboardMetrics = async () => {
  const response = await axiosGet("dashboard/metrics", true);
  return response as DashMetRes;
};

// Custom hook
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ["dashboard-metrics"], // cache key
    queryFn: fetchDashboardMetrics,
    placeholderData : (prev)=> prev,
    retry : false,
  });
};

export interface UserResponse {
  page : number,
  limit : number,
  total : number,
  totalPages: number,
  users : IUser[],
}

const fetchUsers = async (params : {status ?: string, role ?: string, search ?: string, page : number, limit : number}) => {
  const queryParams = new URLSearchParams();
  if(params.search) queryParams.append("search", params.search);
  if(params.status) queryParams.append("status", params.status);
  if(params.role) queryParams.append("role", params.role);
  if(params.page) queryParams.append("page", String(params.page));
  if(params.limit) queryParams.append("limit", String(params.limit));

  const response = await axiosGet(`users?${queryParams.toString()}`, true);
  return response as UserResponse;
};

// Custom hook
export const useUsers = (params : {status ?: string, role ?: string, search ?: string, page : number, limit : number}) => {
  return useQuery({
    queryKey: ["users",params.status,params.search,params.role, params.page, params.limit], // cache key
    queryFn: ()=>fetchUsers(params),
    retry : false,
  });
};

