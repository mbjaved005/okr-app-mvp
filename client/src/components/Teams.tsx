import React, { useState } from 'react';
import api from '../api/Api';

const Teams = () => {
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setProfilePicture(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!profilePicture) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', profilePicture);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        alert('File uploaded successfully');
        console.log('Cloudinary URL:', response.data.url);
      } else {
        alert('File upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('An error occurred while uploading the file');
    }
  };

  return (
    <div>
      <h1>Teams</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Profile Picture</button>
    </div>
  );
};

export default Teams;
