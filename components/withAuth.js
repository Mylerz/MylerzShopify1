import React, {Component, createContext, useState, useContext, useEffect, useLayoutEffect} from 'react'
import Router from 'next/router'
// import React, { createContext, useState, useContext, useEffect, useLayoutEffect } from 'react'
// import TokenContext from '../context/TokenContext'
// import { getCookie } from '../utils/Cookies'
import Cookies from "js-cookie";

export default function withAuth(AuthComponent) {
    return class Authenticated extends Component {

      // static async getInitialProps(ctx) {
      //   debugger
      //   const token = Cookies.get('token')
      //   // Check if Page has a `getInitialProps`; if so, call it.
      //   const pageProps = AuthComponent.getInitialProps && await AuthComponent.getInitialProps(ctx);
      //   // Return props.
      //   return { ...pageProps, token }
      // }

      constructor(props) {
        debugger
        super(props)
        this.state = {
          isLoading: true
        };
      }

      async componentDidMount () {
        console.log('checking auth')
        debugger
        this.authenticate(Cookies.get('access_token'))
        // if (!Cookies.get('access_token')) {
        //   Router.push('/login')
        // }
        // else
        //     this.setState({ isLoading: false })
      }

      render() {
        return (
          <div>
          {this.state.isLoading ? (
              <div>LOADING....</div>
            ) : (
            //   <TokenContext.Provider value={this.props.token}>
                <AuthComponent {...this.props} />
            //   </TokenContext.Provider>
            )}
          </div>
        )
      }

      authenticate = async (token)=>{
        let response = await fetch("api/warehouses", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            token: token,
          }),
        });
    
        let result = await response.json();
        console.log(result);
    
        if (result.Error == "Authorization has been denied for this request.") {
          Router.push('/login')
        }else{
          this.setState({ isLoading: false })
        }
      }
    }
}

//  const withAuth = Component =>{
//   // debugger
//    const authComponent = props => {
//     const [Authenticated, setAuthenticated] = useState(true)
//     const isAuthenticated = ()=> Cookies.get("access_token")
    
//     useEffect(() => {
//           if (!isAuthenticated() ) {
//               debugger
//               setAuthenticated(false)
//               Router.push('/login')          
//           }
//     }, [])

//     return (
//           <div>
//             {
//               !Authenticated ? 
//               (<div>LOADING....</div>) : 
//               (<Component {...props} />)
//             }
//           </div>
//         ) 
//   }

//   return authComponent
// }

// export default withAuth