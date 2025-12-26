import { IFeedback } from "@/interface/feedback.interface";
import { axiosGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const fetchFeedbackList = async (params : {type ?: string, status ?: string, search : string}) => {
  const queryParams = new URLSearchParams();
  if(params.search) queryParams.append("search", params.search);
  if(params.type) queryParams.append("type", params.type);
  if(params.status) queryParams.append("status", params.status);

  const response = await axiosGet(`feedbacks?${queryParams.toString()}`, true);
  return response as IFeedback[];
};

export const useFeedbackList = (params : {type ?: string, status ?: string, search : string}) => {
  return useQuery({
    queryKey: ["feedback-list",params.type,params.search,params.status],
    queryFn: ()=>fetchFeedbackList(params),
    retry : false,
  });
};

export interface AnalyticsRes {
  complaintsBySegment : {name : string, value : number}[],
  sentiments : {name : string, value : number}[]
}

const fetchFeedbackAnalytics = async () => {
  const response = await axiosGet(`feedbacks/analytics`, true);
  return response as AnalyticsRes
};

export const useFeedbackAnalytics = () => {
  return useQuery({
    queryKey: ["feedback-analytics"],
    queryFn: ()=>fetchFeedbackAnalytics(),
    retry : false,
  });
};