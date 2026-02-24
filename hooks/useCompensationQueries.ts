import { ICompensation } from "@/interface/compensation.interface";
import { axiosGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface CompRes{
    data : ICompensation[],
    meta : {
        total : number,
        page : number,
        limit : number,
        totalPages : number
    }
}

const fetchCompensationList = async (params : {category ?: string, status ?: string, search : string, page : number, limit : number}) => {
  const queryParams = new URLSearchParams();
  if(params.search) queryParams.append("search", params.search);
  if(params.status) queryParams.append("status", params.status);
  if(params.category) queryParams.append("category", params.category);
  if(params.page) queryParams.append("page", String(params.page));
  if(params.limit) queryParams.append("limit", String(params.limit));

  const response = await axiosGet(`compensations?${queryParams.toString()}`, true);
  return response as CompRes;
};

export const useCompensationList = (params ?: {category ?: string, status ?: string, search : string, page : number, limit : number}) => {
  return useQuery({
    queryKey: ["compensation-list",params],
    queryFn: ()=>fetchCompensationList(params),
    retry : false,
  });
};