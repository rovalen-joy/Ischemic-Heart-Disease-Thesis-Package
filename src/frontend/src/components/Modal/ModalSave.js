import React, { useRef, useEffect, useState } from 'react'; 
import { IoMdClose } from 'react-icons/io';

const ModalSave = ({ setModalSave, handleSaveData }) => {
  const modalRef = useRef(null);
  const [disableSaveButton, setDisableSaveButton] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setModalSave(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [setModalSave]);

  const handleConfirmButton = async () => {
    setDisableSaveButton(true);
    try {
      await handleSaveData();
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setDisableSaveButton(false);
      setModalSave(false);
    }
  };

  return (
    <div className='fixed z-[100] inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center py-2 overflow-y-auto'>
      <div className='mx-auto rounded-xl bg-white p-8 relative' ref={modalRef}>
        <div className='absolute top-2 right-2'>
          <IoMdClose
            size={24}
            className='cursor-pointer text-gray-500'
            onClick={() => setModalSave(false)}
          />
        </div>
        <div className='flex flex-col gap-5'>
          <div className='flex justify-center font-sans font-bold text-2xl text-[#00717A]'>
            Save Patient Data
          </div>
          <div className='px-6 font-sans text-gray-700'>
            Are you sure you want to save the patient's data?
          </div>
          <div className='flex justify-end gap-2'>
            <button
              onClick={() => setModalSave(false)}
              className='text-black bg-transparent border-2 border-[#00717A] py-2 px-4 rounded-md'
            >
              Cancel
            </button>
            <button
              className='text-white bg-[#00717A] py-2 px-5 rounded-md disabled:opacity-50'
              onClick={handleConfirmButton}
              disabled={disableSaveButton}
            >
              {disableSaveButton ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSave;