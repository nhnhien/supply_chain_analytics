// src/pages/Upload.jsx
import React from 'react';
import Layout from '../components/common/Layout';
import FileUpload from '../components/upload/FileUpload';

const Upload = () => {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Tải lên dữ liệu</h1>
        <FileUpload />
      </div>
    </Layout>
  );
};

export default Upload;