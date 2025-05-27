export default function AvisoPrivacidad() {
  return (
    <div className='flex justify-center items-center min-h-screen bg-gray-100 p-4'>
      <iframe
        src='/aviso-de-privacidad.pdf'
        width='100%'
        height='800px'
        className='border border-gray-300 rounded-md shadow-md'
        title='Aviso de Privacidad'
      ></iframe>
    </div>
  );
}
