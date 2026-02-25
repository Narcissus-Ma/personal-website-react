export interface Website {
  url: string;
  logo: string;
  title: string;
  desc: string;
  is_hot?: boolean;
}

export interface Category {
  name: string;
  en_name: string;
  icon: string;
  web?: Website[];
  children?: Category[];
}
