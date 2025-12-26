import { IEnquiry } from "@/interface/enquiry.interface";
import { axiosGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface EnqRes{
    data : IEnquiry[],
    meta : {
        total : number,
        page : number,
        limit : number,
        totalPages : number
    }
}

const fetchEnquiryList = async () => {
  const response = await axiosGet(`enquiries`, true);
  return response as EnqRes;
};

export const useEnquiryList = () => {
  return useQuery({
    queryKey: ["enquiry-list",],
    queryFn: ()=>fetchEnquiryList(),
    retry : false,
  });
};