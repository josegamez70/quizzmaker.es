// src/components/PrivacyPolicyView.tsx

import React from 'react';
import { HomeIcon } from './icons.tsx'; // Asegúrate de que HomeIcon esté en tu icons.tsx

interface PrivacyPolicyViewProps {
  onGoBack: () => void;
}

const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onGoBack }) => {
  return (
    <div className="w-full max-w-4xl p-6 sm:p-8 bg-gray-800 rounded-2xl shadow-2xl animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-bold text-white">Política de Privacidad y Cookies</h2>
        <button onClick={onGoBack} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Volver">
          <HomeIcon className="w-7 h-7" />
        </button>
      </div>
      <div className="text-gray-300 space-y-4 leading-relaxed max-h-[60vh] overflow-y-auto pr-4 -mr-4">
        <h3 className="text-xl font-bold text-indigo-400 mt-4 mb-2">Política de Privacidad</h3>
        <p>Esta política entra en vigor el 15 de julio de 2025.</p>
        <p>Tu privacidad es importante para nosotros. Es nuestra política respetar tu privacidad en relación con cualquier información que podamos recopilar de ti a través de nuestro sitio web y otros sitios que poseemos y operamos.</p>
        <p>Solo solicitamos información personal cuando realmente la necesitamos para brindarte un servicio. La recopilamos por medios justos y legales, con tu conocimiento y consentimiento. También te informamos por qué la estamos recopilando y cómo se utilizará.</p>
        <p>Solo conservamos la información recopilada durante el tiempo necesario para proporcionarte el servicio solicitado. Los datos que almacenamos los protegemos por medios comercialmente aceptables para evitar pérdidas, robos, así como accesos, divulgaciones, copias, usos o modificaciones no autorizadas.</p>
        <p>No compartimos información de identificación personal públicamente ni con terceros, salvo cuando sea requerido por la ley.</p>
        <p>Nuestro sitio web puede contener enlaces a sitios externos que no son operados por nosotros. Ten en cuenta que no tenemos control sobre el contenido ni las prácticas de estos sitios, y no podemos aceptar responsabilidad por sus respectivas políticas de privacidad.</p>
        <p>Tienes la libertad de rechazar nuestra solicitud de información personal, con el entendimiento de que es posible que no podamos ofrecerte algunos de los servicios deseados.</p>
        <p>El uso continuado de nuestro sitio web se considerará como aceptación de nuestras prácticas en torno a la privacidad y la información personal. Si tienes alguna pregunta sobre cómo manejamos los datos de los usuarios y la información personal, no dudes en contactarnos.</p>
        
        <h3 className="text-xl font-bold text-indigo-400 mt-8 mb-2">Política de Cookies</h3>
        <p>Esta política de cookies ("Política") describe qué son las cookies y cómo el Operador del Sitio Web ("nosotros", "nos" o "nuestro") las utiliza en nuestro sitio web y en cualquiera de sus productos o servicios (colectivamente, el "Sitio Web" o los "Servicios").</p>
        <p>Debes leer esta Política para entender qué tipos de cookies usamos, la información que recopilamos mediante cookies y cómo se utiliza dicha información. También se describen las opciones que tienes para aceptar o rechazar el uso de cookies. Para más información sobre cómo usamos, almacenamos y protegemos tus datos personales, consulta nuestra Política de Privacidad.</p>
        
        <h4 className="text-lg font-semibold text-indigo-300 mt-6 mb-2">¿Qué son las cookies?</h4>
        <p>Las cookies son pequeños fragmentos de datos almacenados en archivos de texto que se guardan en tu ordenador u otros dispositivos cuando se cargan sitios web en un navegador. Se utilizan ampliamente para recordar al usuario y sus preferencias, ya sea durante una sola visita (mediante una "cookie de sesión") o en visitas repetidas (mediante una "cookie persistente").</p>
        <p>Las cookies de sesión son temporales y se utilizan solo durante tu visita al Sitio Web, y expiran al cerrar el navegador.</p>
        <p>Las cookies persistentes se usan para recordar tus preferencias dentro del Sitio Web y permanecen en tu dispositivo incluso después de cerrar el navegador o reiniciar el ordenador. Estas aseguran una experiencia coherente y eficiente durante tus visitas.</p>
        <p>Las cookies pueden ser establecidas por el propio Sitio Web ("cookies propias") o por terceros, como quienes ofrecen contenido, publicidad o servicios de análisis en el sitio web ("cookies de terceros"). Estos terceros pueden reconocerte tanto cuando visitas nuestro sitio como cuando visitas otros sitios web.</p>

        <h4 className="text-lg font-semibold text-indigo-300 mt-6 mb-2">¿Qué tipo de cookies utilizamos?</h4>
        <ul className="list-disc list-inside space-y-2 pl-4">
          <li><strong>Cookies necesarias:</strong> Permiten ofrecerte la mejor experiencia posible al acceder y navegar por el Sitio Web y utilizar sus funciones. Por ejemplo, reconocen si has creado una cuenta e iniciado sesión.</li>
          <li><strong>Cookies de funcionalidad:</strong> Permiten operar el Sitio Web y los Servicios según tus elecciones. Por ejemplo, reconocen tu nombre de usuario y recuerdan tus personalizaciones en visitas futuras.</li>
          <li><strong>Cookies analíticas:</strong> Nos permiten a nosotros y a servicios de terceros recopilar datos agregados con fines estadísticos sobre el uso del Sitio Web. Estas cookies no contienen información personal identificable y ayudan a mejorar tu experiencia de usuario.</li>
          <li><strong>Cookies de redes sociales:</strong> Cookies de terceros (por ejemplo, Facebook, Twitter, etc.) que permiten rastrear a los usuarios de redes sociales cuando visitan nuestro Sitio Web, utilizan nuestros servicios o comparten contenido, mediante mecanismos de etiquetado proporcionados por esas redes. Estas cookies también se utilizan para el seguimiento de eventos y fines de remarketing. Los datos recopilados se utilizarán conforme a nuestras políticas de privacidad y las de las redes sociales. No recopilamos ni compartimos información personal identificable del usuario.</li>
        </ul>

        <h4 className="text-lg font-semibold text-indigo-300 mt-6 mb-2">¿Cuáles son tus opciones respecto a las cookies?</h4>
        <p>Si no estás de acuerdo con el uso de cookies, puedes modificar la configuración de tu navegador para eliminar las cookies ya establecidas o evitar que se acepten nuevas. Para saber más sobre cómo hacerlo o sobre las cookies en general, visita <a href="https://www.internetcookies.org" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">internetcookies.org</a>.</p>
        
        <h4 className="text-lg font-semibold text-indigo-300 mt-6 mb-2">Cambios y modificaciones</h4>
        <p>Nos reservamos el derecho de modificar esta Política en cualquier momento, con efecto desde la publicación de una versión actualizada en el Sitio Web. Cuando lo hagamos, actualizaremos la fecha al final de esta página. El uso continuado del Sitio Web después de dichos cambios constituye tu consentimiento a ellos. Política creada con WebsitePolicies.</p>

        <h4 className="text-lg font-semibold text-indigo-300 mt-6 mb-2">Aceptación de esta política</h4>
        <p>Reconoces haber leído esta Política y aceptas todos sus términos y condiciones. Al utilizar el Sitio Web o sus Servicios, aceptas quedar vinculado por esta Política. Si no estás de acuerdo con los términos, no estás autorizado a utilizar el Sitio Web ni sus Servicios.</p>
        
        <h4 className="text-lg font-semibold text-indigo-300 mt-6 mb-2">Contacto</h4>
        {/* MODIFICADO: Añadido el correo electrónico con un enlace mailto */}
        <p>Si deseas ponerte en contacto con nosotros para obtener más información sobre esta Política o sobre cualquier asunto relacionado con el uso de cookies, puedes hacerlo a través de la siguiente dirección de correo electrónico: <a href="mailto:quizzmaker@outlook.com" className="text-purple-400 hover:underline">quizzmaker@outlook.com</a></p>

        <p className="text-sm text-gray-500 mt-8 pt-4 border-t border-gray-700/50">Última actualización de este documento: 10 de julio de 2025.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyView;