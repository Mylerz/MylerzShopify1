import React, { useState,useEffect } from 'react';
import {Stack, Button, Page} from '@shopify/polaris';
import PDFComponent from "../components/pdfComponent";
import Router from "next/router";

const PrintPDF = (props)=>{

  const [awbList, setAwbList] = useState([])

  useEffect(()=>{
    // debugger
    // let awbs = [Router.query.awbList].flat()
    setAwbList(Router.query.awbList)
  })
  debugger
  return(
    <Page>
      <div className="noprint">
      <Stack>
        <Stack.Item fill>
          <Button
            onClick={()=>{Router.back()}}
          >Back</Button>
        </Stack.Item>
        <Stack.Item>
          <Button primary
            onClick={()=>{window.print() }}
          >Print</Button>
        </Stack.Item>
          
      </Stack>
        
      </div>
        <div id="print">
        {Array.isArray(awbList)?awbList.map(awb=><PDFComponent key={awb} awb={awb}></PDFComponent>):<PDFComponent key={awbList} awb={awbList}></PDFComponent>}
        </div>
    </Page>
  )

}

export default PrintPDF;