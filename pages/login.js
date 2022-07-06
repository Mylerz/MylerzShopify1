import {InlineError,Form, FormLayout, Button, TextField, Page, Layout, Card,} from '@shopify/polaris'
import { useCallback, useState,useEffect } from "react";
import Cookies from 'js-cookie';
// import { Router } from 'react-router-dom';
import Router from 'next/router'

export default function Login (){
    const [userName,setUserName] = useState('');
    const [password,setPassword] = useState('');
    const [isWrongCredential,setIsWrongCredential] = useState(false);
    


   const handleUserNameChanged = async(value) => setUserName(value);
    const handlePasswordChanged = value => setPassword(value);
    
    const handleSubmit = async(e)=>{
        let data = {
            // "grant_type":"password",
            "username":userName,
            "password":password
        }

        // console.log(JSON.stringify(data));

        
        
        try {
            debugger
            
            let response = await fetch(`/api/login`,{
                headers:{
                    'Content-Type':'application/json',
                  },
                method:'POST',
                body:JSON.stringify(data)
            })

            let result = await response.json()
            debugger
            if(result.status==='success'){
                Cookies.set("access_token",result.data.access_token, {
                    httpOnly: false,
                    secure: true,
                    sameSite: 'none'
                  })
                console.log(Cookies.get("access_token"));
                Router.push("/")
            }
            else 
                setIsWrongCredential(true)
            
        } catch (error) {
            debugger
            console.log(error);

        }

    }

    


    return(
        <Page>
            <Layout>
                <Layout.Section fullWidth>
                    
                
                    <Layout.AnnotatedSection
                        title="Mylerz Login Credentials"
                    >
                        <Card sectioned>
                            <Form onSubmit={handleSubmit}>
                                <FormLayout>
                                    <TextField
                                        value={userName}
                                        onChange={handleUserNameChanged}
                                        label="UserName"
                                        type="text"
                                        placeholder="username"
                                    />
                                    <TextField
                                        value={password}
                                        onChange={handlePasswordChanged}
                                        label="Password"
                                        type="password"
                                        placeholder="password"
                                    />
                                    <Button submit>Login</Button>
                                </FormLayout>
                            </Form>
                        </Card>
                    </Layout.AnnotatedSection>
                </Layout.Section>
            </Layout>
            {isWrongCredential?(
                <InlineError message="Wrong Username Or Password"  />
              ):(<div></div>)}
        </Page>
    );
}
