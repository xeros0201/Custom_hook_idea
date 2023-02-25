import axios from "axios"
import { useMutation, useQuery } from "react-query"
import { useLogged, useLogin } from "../redux/hook"
import jwt_decode from "jwt-decode"
import { toast } from "react-toastify"
const errorRes = (error) =>{
  return error.response.data.message
}
const useCreateAxios = () =>{
  const user = useLogged()
  const { login,logOut} = useLogin()
  const  API_V2_NOAUTH = axios.create({
    baseURL: `https://api.phobendoi.art/api`
  })

 
    const axios_JWT= axios.create({
      baseURL :'https://api.phobendoi.art/api',
      headers:{token:`Bearer ${user?.accessToken}`},
      
      params:{
  
        id:user._id,
     
      },
    })
 
    axios_JWT.interceptors.request.use(

      async(config)=>{
     
        let date = new Date()
        const decodedToken =jwt_decode(user.accessToken)
    
        const check = decodedToken.exp*1000 < date.getTime()
        
        if(decodedToken.exp*1000 < date.getTime()){
          let data
          try {
    
            const res = await API_V2_NOAUTH.get(`/auth/refresh_v2`,{
              headers:{
                token: `Bearer ${user.refreshToken}`
              }
            })
        
              data= res.data
          } catch (error) {
            logOut()
           return console.log(error)
          }
   
             
           const refreshUser ={
             ...user,
             accessToken: data.accessToken,
             refreshToken: data.refreshToken
           }
           login(refreshUser)
           config.headers["token"]= `Bearer ${data.accessToken}`;
        }
          
        return config
      },
      (error)=>{
         
        return Promise.reject(error)
      }
    )

 
  return  {
    API_V2_NOAUTH,
    axios_JWT
  }
}
export const useCommonQuery = ({key,route,query,option}) =>{
  const {  axios_JWT} = useCreateAxios()
    const apiCall = async ()=>{
        try {
        
          const res = await axios_JWT.get(route,{
            params:query
          })
        
          return res.data
        } catch (error) {
          throw new Error(errorRes(error))
        }
    }
 
   const {isLoading, refetch, isError, isSuccess,error,data} =  useQuery(key,apiCall,{
    ...option,
    refetchOnReconnect:false,
    refetchOnWindowFocus:false
  })
  const checkState = () =>{ 

    if(isLoading) return <div>Loading...</div>
    if(isError) return <div>{error.message}</div>
    return null
  }

 

    return {
      data,
      checkState,
      refetch,
      isLoading
    }
}
export const useCommonMutation = ({route ,query,onMutateCB,onSuccessCB}) =>{
   
  const {  axios_JWT } = useCreateAxios()

    const apiCall = async ({data})=>{
      const id = toast.loading("Please wait...")
      try { 
    
        const res = await axios_JWT.post(route,data,{
          params:query
        })
        toast.update(id, {render: res.data?.message|| res.data||"All is good", 
        autoClose:2000,
        closeButton:true,
        hideProgressBar: false,
        progress: undefined,
        theme: "light",
        type: "success", isLoading: false});
        return res.data
      } catch (error) {
      
        toast.update(id, {render: errorRes(error),
          autoClose:5000,
          hideProgressBar: false,
          progress: undefined,
          closeButton:true,
          theme: "light",
           type: "error", isLoading: false });
        throw new Error(errorRes(error))

      }
   
    }
    

    
    return useMutation(  apiCall,{
      onMutate: async()=>{
        try {
          await  onMutateCB()
        } catch (error) {
          return
        }

      },
      onSuccess:  (data )=>{
        if(!onSuccessCB) return
        onSuccessCB(data)
      }
    })
}
export const useCommonQueryNoAuth = ({key,route,query,option}) =>{
  const {API_V2_NOAUTH} = useCreateAxios()
    const apiCall = async ()=>{
        try {
          const res = await API_V2_NOAUTH.get(route,{
            params:query
          })
        
          return res.data
        } catch (error) {
          throw new Error(errorRes(error))
        }
    }
 
   const {isLoading, refetch, isError, isSuccess,error,data} =  useQuery(key,apiCall,{
    ...option,
    refetchOnReconnect:false,
    refetchOnWindowFocus:false,
    refetchOnMount:"always"
  })
  const checkState = () =>{ 

    if(isLoading) return <div>Loading...</div>
    if(isError) return <div>{error.message}</div>
    return null
  }

 

    return {
      data,
      checkState,
      refetch,
      isLoading,
      isSuccess
    }
}
export const useCommonMutationNoAuth = ({route ,query,onMutateCB,onSuccessCB,onFailedCB}) =>{
  const {API_V2_NOAUTH} = useCreateAxios()
    const apiCall = async ({data})=>{
    
        try {
          const res = await API_V2_NOAUTH.post(route,data,{
            params:query
          })
        
          return res.data
        } catch (error) {
          console.log(error)
          throw new Error(errorRes(error))
        }
    }
    
    return useMutation(apiCall,{
      onMutate: async()=>{
        try {
          await  onMutateCB()
        } catch (error) {
          return
        }

      },
      onSuccess:  (data )=>{
        if(!onSuccessCB) return
        onSuccessCB(data)
      },
      onError: (data)=>{
        if(!onFailedCB) return
        console.log(data)
        onFailedCB(data)
      }
    })
}
