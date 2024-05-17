import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie';
import ConfirmationWindow from './ConfirmationWindow.jsx';
import MessageModal from './MessageModal.jsx'
import './Files.css';

// For real-time files need to use Base64 encoding, and decoding on the backend

export default function FileRepo({projectId, currentUsername, isAdmin}) {
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

    function handleDeleteFile(fileId) {
        const file_id = parseInt(fileId);
        const csrftoken = Cookies.get('csrftoken');

        fetch('/delete_file',{
            method:'DELETE',
            headers:{
                'Content-Type':'application/json',
                'X-CSRFToken': csrftoken
            },
            body:JSON.stringify({
                file_id: file_id
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                setFiles(files => files.filter(f => f.id !== file_id));
            }
        })
        .catch(error => {
            console.log(error);
        })
    }


    return (
        <>
        <FileUploadArea projectId={projectId} addFile={addFile} />
        <hr></hr>
        <Files files={files} loadFiles={loadFiles} projectId={projectId} currentUsername={currentUsername} handleDeleteFile={handleDeleteFile} isAdmin={isAdmin} />
        </>
    )
}


function Files({projectId, files, loadFiles, currentUsername, handleDeleteFile, isAdmin}) {
    
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
                <FileComponent key={file.id} file={file} projectId={projectId} currentUsername={currentUsername} handleDeleteFile={handleDeleteFile} isAdmin={isAdmin}/> 
            )
            )}
        </div>
    )
}

function FileComponent({file, projectId, currentUsername, handleDeleteFile, isAdmin}) {
    const [fileToDelete,setFileToDelete] = useState(null);
    const [showConfirmation,setShowConfirmation] = useState(false);

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

    function askDeleteFile(fileId) {
        setFileToDelete(fileId);
        setShowConfirmation(true);
    }

    function confirmDelete() {
        setShowConfirmation(false);
        handleDeleteFile(fileToDelete);
    }

    function cancelDelete() {
        setFileToDelete(null);
        setShowConfirmation(false);
    }

    return (
        <>        
        <div key={file.id} className="file-component">
            <p className="file-name">{file.name} {file.type && <span className="file-type">( {file.type} )</span>}</p>
            <p className="file-uploaded-by"><strong>From:</strong> {file.uploaded_by}</p>
            <p className="file-timestamp">{file.timestamp}</p>
            {/* Add a link for downloading the file */} 
            <div className="file-actions">
                <button className="download-btn" onClick={handleDownload}>
                    <i className="fa-solid fa-download"></i>
                </button>
                {(file.uploaded_by === currentUsername || isAdmin) && <button className="delete-file-btn" onClick={() => askDeleteFile(file.id)}>&#x2717;</button>}
            </div>       
        </div> 
        {showConfirmation && (
            <ConfirmationWindow 
                message="Are you sure you want to delete this file?"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        )}
        </>
    );
}


function FileUploadArea({projectId, addFile}) {
    const [fileToUpload, setFileToUpload] = useState('');
    const [uploadAs, setUploadAs] = useState('');
    const [message,setMessage] = useState('');
    const [showFileModal, setShowFileModal] = useState(false);

    function uploadFile(e) {
        e.preventDefault();
        if (!fileToUpload) {
            setMessage('Please provide a file to upload');
            return
        }

        if (!uploadAs || uploadAs.trim() === '') {
            setMessage('Please provide a name for you file');
            return
        }

        const csrfToken = Cookies.get('csrftoken');
        let formData = new FormData();

        const fileNamePart = fileToUpload.name.split('.');
        const fileExtension = fileNamePart.pop();

        formData.append('uploaded_file',fileToUpload);
        formData.append('file_name',uploadAs);
        formData.append('project_id',projectId);
        formData.append('file_extension',fileExtension);

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
            setFileToUpload(null);
            setUploadAs('');
            addFile(result.file);
            setShowFileModal(false);
        })
        .catch(error => {
            console.log(error);
        })  
    }

    function handleDrop(e) {
        e.preventDefault();
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            setFileToUpload(droppedFiles[0]);
        }
    }

    return (
        <>
        <div className="new-file-btn-div">
            <button className="new-file-btn" onClick={() => setShowFileModal(!showFileModal)}>Add File +</button>
        </div>
        {showFileModal &&
        <div className="upload-modal">
            <h3>Upload File</h3>
            <form 
                className="upload-form" 
                onSubmit={uploadFile}
                onDragEnter={(e) => e.preventDefault()}
                onDragLeave={(e) => e.preventDefault()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                
                <div className="drop-area">
                 {fileToUpload !== '' && fileToUpload !== null ? (
                    <p className="file-name">{fileToUpload.name}</p> ) : (
                    <i className="fa-solid fa-upload"></i>
                    )
                }   
                    <div className="drag">
                        Drop your file here or 
                        <div className="browse">
                            <label
                                className="file-upload-label"
                                onClick={() => document.getElementById('get-file').click()}
                            >Browse</label>
                            <input className="file-input" id="get-file" type="file" data-max-size="10240" onChange={(e) => setFileToUpload(e.target.files[0])} />
                            
                        </div>
                    </div>
                </div>
                <input className="file-name-input" type="text" onChange={(e) => setUploadAs(e.target.value)} value={uploadAs} autoFocus placeholder="File name" />
                <div className="upload-modal-btns">
                    <button type="submit"><i className="fa-solid fa-upload"></i></button>
                    <button className="close-modal-btn" onClick={(e) => {e.preventDefault();setShowFileModal(false);}}>X</button>
                </div>
            </form>
            {message && <MessageModal message={message} resetMessage={setMessage} /> }
        </div>
        }
        </>
    )
}