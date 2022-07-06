import { Page as PolarisPage, Stack, Button } from '@shopify/polaris'
import React, { useState, useEffect } from 'react';
import Router from "next/router";
import { Document, Page, } from 'react-pdf';
import PDF from "react-pdf";
const { forwardRef, useRef, useImperativeHandle } = React;

const PDFComponent = forwardRef((props, ref) => {

  const [numPages, setNumPages] = useState(null);
  const [awb, setAwb] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    setAwb(props.awb)
  })

  useImperativeHandle(ref, () => ({

    print() {
      window.print();
    }

  }));

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function _base64ToArrayBuffer(base64) {
    const byteCharacters = atob(base64);

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    return byteArray;
  }

  return (
    <PolarisPage>
      <Document
        file={{ data: _base64ToArrayBuffer(awb) }}
        onLoadSuccess={onDocumentLoadSuccess}
        options={{
          isEvalSupported: true,
          // cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@2.4.456/cmaps/`,
          // cMapPacked: true,
        }}
      >
        <Page
          pageNumber={pageNumber} />
      </Document>
    </PolarisPage>

  )
})


export default PDFComponent;