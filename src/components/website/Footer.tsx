import Link from 'next/link';
import Image from 'next/image';
import {
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
} from 'lucide-react';
export default function Footer() {
  return (
    <footer className='py-12 md:py-16 relative overflow-hidden'>
      <div className='container mx-auto px-4'>
        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12'>
          <div className='space-y-4'>
            <Link
              href='/'
              className='inline-block'
            >
              <Image
                src='/holistia-blanco.png'
                alt='Holistia'
                width={120}
                height={40}
                className='h-8 w-auto'
              />
            </Link>
            <p className='text-sm text-white/70'>
              Holistia es un ecosistema digital que conecta a quienes buscan
              mejorar su calidad de vida con profesionales especializados.
            </p>
            <div className='flex gap-4'>
              <Link
                href='#'
                className='h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#AC89FF] hover:to-[#83C7FD] transition-all duration-300 hover:scale-110 group'
              >
                <Instagram className='h-5 w-5 text-white/70 group-hover:text-white' />
                <span className='sr-only'>Instagram</span>
              </Link>
              <Link
                href='#'
                className='h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#AFF344] hover:to-[#83C7FD] transition-all duration-300 hover:scale-110 group'
              >
                <Twitter className='h-5 w-5 text-white/70 group-hover:text-white' />
                <span className='sr-only'>Twitter</span>
              </Link>
              <Link
                href='#'
                className='h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#83C7FD] hover:to-[#FFE5BE] transition-all duration-300 hover:scale-110 group'
              >
                <Facebook className='h-5 w-5 text-white/70 group-hover:text-white' />
                <span className='sr-only'>Facebook</span>
              </Link>
              <Link
                href='#'
                className='h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#FFE5BE] hover:to-[#FF9900] transition-all duration-300 hover:scale-110 group'
              >
                <Linkedin className='h-5 w-5 text-white/70 group-hover:text-white' />
                <span className='sr-only'>LinkedIn</span>
              </Link>
            </div>
          </div>

          {/* <div>
            <h3 className="font-medium text-white mb-4">Plataforma</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Características
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Comunidad
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Profesionales
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Eventos
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-white mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Sobre nosotros
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Blog
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Carreras
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Contacto
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Términos de servicio
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Política de privacidad
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Cookies
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
            </ul>
          </div> */}
        </div>

        <div className='mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center'>
          <p className='text-sm text-white/50'>
            &copy; {new Date().getFullYear()} Holistia. Todos los derechos
            reservados.
          </p>
          <div className='mt-4 md:mt-0'>
            <p className='text-sm text-white/50'>
              Diseñado con <span className='text-[#AFF344]'>♥</span> para tu
              bienestar
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
