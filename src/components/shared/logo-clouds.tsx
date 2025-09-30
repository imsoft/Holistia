import Image from "next/image";
import Link from "next/link";

export const LogoClouds = () => {
  return (
    <div className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-x-8 gap-y-16 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-xl lg:mx-0">
            <h2 className="text-4xl font-semibold tracking-tight text-pretty text-foreground sm:text-5xl">
              Trusted by the most innovative teams
            </h2>
            <p className="mt-6 text-lg/8 text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Et,
              egestas tempus tellus etiam sed. Quam a scelerisque amet
              ullamcorper eu enim et fermentum, augue.
            </p>
            <div className="mt-8 flex items-center gap-x-6">
              <Link
                href="#"
                className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Create account
              </Link>
              <Link
                href="#"
                className="text-sm font-semibold text-foreground hover:text-muted-foreground"
              >
                Contact us <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
          <div className="mx-auto grid w-full max-w-xl grid-cols-2 items-center gap-y-12 sm:gap-y-14 lg:mx-0 lg:max-w-none lg:pl-8">
            <Image
              alt="Tuple"
              src="https://tailwindcss.com/plus-assets/img/logos/tuple-logo-gray-900.svg"
              width={105}
              height={48}
              className="max-h-12 w-full object-contain object-left"
            />

            <Image
              alt="Reform"
              src="https://tailwindcss.com/plus-assets/img/logos/reform-logo-gray-900.svg"
              width={104}
              height={48}
              className="max-h-12 w-full object-contain object-left"
            />

            <Image
              alt="SavvyCal"
              src="https://tailwindcss.com/plus-assets/img/logos/savvycal-logo-gray-900.svg"
              width={140}
              height={48}
              className="max-h-12 w-full object-contain object-left"
            />

            <Image
              alt="Laravel"
              src="https://tailwindcss.com/plus-assets/img/logos/laravel-logo-gray-900.svg"
              width={136}
              height={48}
              className="max-h-12 w-full object-contain object-left"
            />

            <Image
              alt="Transistor"
              src="https://tailwindcss.com/plus-assets/img/logos/transistor-logo-gray-900.svg"
              width={158}
              height={48}
              className="max-h-12 w-full object-contain object-left"
            />

            <Image
              alt="Statamic"
              src="https://tailwindcss.com/plus-assets/img/logos/statamic-logo-gray-900.svg"
              width={147}
              height={48}
              className="max-h-12 w-full object-contain object-left"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
