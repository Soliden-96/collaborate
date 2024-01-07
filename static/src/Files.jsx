import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie';

// For real-time files need to use Base64 encoding, and decoding on the backend

export default function FileRepo({projectId}) {
    const [files, setFiles] = useState([]);

    function addFile(file) {
        setFiles((files) => ([
            file,
            ...files
        ]))
    }

    function loadFiles(files) {
        setFiles(files.reverse());
    }


    return (
        <>
        <FileUploadArea projectId={projectId} addFile={addFile} />
        <hr></hr>
        <Files files={files} loadFiles={loadFiles} projectId={projectId} />
        </>
    )
}


function Files({projectId,files,loadFiles}) {
    
    // Security to ask for including project id in url
    useEffect(() => {
        fetch(`/get_project_files/${projectId}`)
        .then(response => response.json())
        .then(data => {
            data.files && loadFiles(data.files);   
        })
        .catch(error => {
            console.log(error);
        })
    },[projectId]);
    return (
        <div className="files-div">
            {files.map((file) => (
                <FileComponent key={file.id} file={file} projectId={projectId} /> 
            )
            )}
        </div>
    )
}

function FileComponent({file,projectId}) {

    function handleDownload() {
        fetch(`/download_file/${projectId}/${parseInt(file.id)}`)
        .then(response => {
            if (response.ok) {
                response.blob().then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    });
            } else {
                return response.json()
            }
        })
        .catch(error =>{
            console.log(error);
        });
    }
    return (
        <div key={file.id} className="file-component">
            <p>Name: {file.name}</p>
            <p>Uploaded By: {file.uploaded_by}</p>
            <p>Timestamp: {file.timestamp}</p>
            {/* Add a link for downloading the file */}
            <button onClick={handleDownload}>
                Download File
            </button>
            <hr></hr>
        </div>
    );
}


function FileUploadArea({projectId, addFile}) {
    const [fileToUpload, setFileToUpload] = useState('');
    const [uploadAs, setUploadAs] = useState('');
    const [message,setMessage] = useState('');

    function uploadFile(e) {
        e.preventDefault();
        const csrfToken = Cookies.get('csrftoken');
        let formData = new FormData();
        formData.append('uploaded_file',fileToUpload);
        formData.append('file_name',uploadAs);
        formData.append('project_id',projectId);
        // line to inspect
        console.log(Object.fromEntries(formData.entries()));
        fetch('/upload_file',{
            method:'POST',
            headers:{
                'X-CSRFToken':csrfToken,
            },
            // Don't stringify formData
            body:formData,
        })
        .then(response => {
            console.log(response);
            return response.json();
        })
        .then(result => {
            setMessage(result.message);
            setFileToUpload(null);
            setUploadAs('');
            addFile(result.file);
        })
        .catch(error => {
            console.log(error);
        })  
    }

    return (
        <div className="upload-area">
            <form onSubmit={uploadFile} >
                <input type="file" onChange={(e) => setFileToUpload(e.target.files[0])} />
                <input type="text" onChange={(e) => setUploadAs(e.target.value)} value={uploadAs} placeholder="File name" />
                <button type="submit">Upload</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    )
}