// import React from 'react'

// const DeleteInvoiceModal = () => {
//   return (
//     <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
//         <ModalContent className="max-w-md">
//           <ModalHeader>
//             <ModalTitle>تایید حذف</ModalTitle>
//           </ModalHeader>
//           <ModalBody>
//             <div className="space-y-4">
//               <div className="flex items-center gap-4">
//                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
//                   <KeenIcon icon="trash" className="text-red-600 text-lg" />
//                 </div>
//                 <div>
//                   <p className="text-gray-900 font-medium">
//                     آیا از حذف این سند اطمینان دارید؟
//                   </p>
//                   {selectedInvoice && (
//                     <p className="text-gray-600 text-sm mt-1">
//                       سند شماره: {selectedInvoice.id}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <p className="text-sm text-gray-600">
//                 این عمل قابل بازگشت نیست و تمام اطلاعات سند حذف خواهد شد.
//               </p>

//               <div className="flex justify-end gap-3 pt-4">
//                 <Button variant="outline" onClick={() => {
//                   setIsDeleteModalOpen(false);
//                   setSelectedInvoice(null);
//                 }}>
//                   لغو
//                 </Button>
//                 <Button
//                   variant="destructive"
//                   onClick={confirmDeleteInvoice}
//                   className="bg-red-600 hover:bg-red-700 text-white"
//                 >
//                   <KeenIcon icon="trash" className="mr-1" />
//                   حذف سند
//                 </Button>
//               </div>
//             </div>
//           </ModalBody>
//         </ModalContent>
//       </Modal>
//   )
// }

// export default DeleteInvoiceModal