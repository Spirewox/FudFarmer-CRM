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

const fetchCompensationList = async () => {
  const response = await axiosGet(`compensations`, true);
  return response as CompRes;
};

export const useCompensationList = () => {
  return useQuery({
    queryKey: ["compensation-list",],
    queryFn: ()=>fetchCompensationList(),
    retry : false,
  });
};