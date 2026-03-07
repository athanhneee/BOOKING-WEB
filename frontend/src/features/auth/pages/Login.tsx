import { useState } from "react"
//import { login } from "../auth.service"

const Login = () => {

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  const handleLogin = async (e:any)=>{
    e.preventDefault()

    try{

      const res = await login({email,password})

      localStorage.setItem("token",res.token)

      alert("Login success")

    }catch(err){
      alert("Login failed")
    }

  }

  return (

    <form onSubmit={handleLogin} className="space-y-4">

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
      />

      <button type="submit">
        Sign In
      </button>

    </form>

  )
}

export default Login