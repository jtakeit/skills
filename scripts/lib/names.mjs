/**
 * Personal-name detection for lead sourcing.
 *
 * The strongest signal that an Instagram account is one person rather than a
 * business is that the display name is a person's name — "Lena Brunner |
 * Coiffeuse Zürich" or "Олена Ковальчук | манікюр Київ" needs no bio to be
 * read. Keyword rules miss it entirely, so it gets its own module.
 *
 * Two detectors, because the market writes names both ways:
 *
 *   given name    "Lena", "Marco", "Наталья", "Олександр" — a list, because a
 *                 first name alone has no shape to match on
 *   surname       "Ковальчук", "Шевченко", "Петрова" — a suffix pattern,
 *                 because Slavic surnames are a closed set of endings and
 *                 listing them all is neither possible nor necessary. Western
 *                 surnames have no such shape, so there the given name is the
 *                 only signal, and the list carries the common ones of the
 *                 German-, French- and Italian-speaking markets.
 *
 * Either one is enough. Both together is as certain as this gets without
 * reading the account.
 *
 * This is a hint, never a verdict: plenty of studios are named after their
 * founder. It moves a row up the reading queue, it does not skip the reading.
 */

const UK_RU = `
олександр александр сашко саша олексій алексей льоша лёша леша андрій андрей
антон артем артём артемій богдан борис вадим валерій валерий валентин василь
василий віктор виктор віталій виталий володимир владимир вова влад владислав
гліб глеб григорій григорий данило даниил денис дмитро дмитрий діма дима євген
евгений женя єгор егор іван иван ваня ігор игорь illia ілля илья костянтин
константин костя кирило кирилл леонід леонид максим марк микола николай коля
михайло михаил міша миша назар нікіта никита олег павло павел петро пётр петр
роман рома руслан сергій сергей сергий серьога серега станіслав станислав стас
степан тарас тимур федір фёдор федор юрій юрий юра ярослав важа марат карен
алла альона алёна алена анастасія анастасия настя анжела анжеліка ангеліна
ангелина анна аня валентина валерія валерия лера вікторія виктория віка вика
віра вера галина ганна дар'я дарья даша діана диана євгенія евгения женя
єлизавета елизавета ліза лиза ірина ирина іра ира інна инна карина каріна
катерина екатерина катя ксенія ксения ксюша лариса лідія лидия лілія
лилия ліна лина людмила люда любов любовь маргарита марго марина марія мария
маша мілана мирослава надія надежда надя наталія наталя наталья наташа неля
нонна оксана олена елена оля ольга поліна полина раїса світлана светлана софія
софия соня таїсія тамара тетяна татьяна таня уляна ульяна юлія юлия яна ярина
brenda maryna olha kateryna iryna nataliia oksana tetiana viktoriia anastasiia
`;

const WEST = `
anna andrea angela barbara bettina carla carmen caroline chiara christina claudia
corinne daniela denise elena eva fabienne franziska gabriela giulia hanna jana
jasmin jessica julia katharina katrin laura lea lena lisa manuela maria marie
martina melanie michelle miriam monika nadia nadine natalie nicole patricia
petra sabine sandra sara sarah silvia simone sonja stefanie tamara tanja ursula
valentina vanessa vera yvonne alessandro andreas benjamin christian daniel david
dominik fabian florian francesco giuseppe hans jan jonas lars luca lukas marco
markus martin matthias michael nicolas oliver pascal patrick peter philipp
raphael reto roger roman sebastian simon stefan thomas tobias urs
`
  .trim()
  .split(/\s+/);

const GIVEN = new Set([...UK_RU.trim().split(/\s+/), ...WEST]);

// Surnames: the endings are the give-away, and they are few.
const SURNAME =
  /(?:енко|енка|ук|юк|чук|ський|ская|ский|цький|цкая|ов|ев|єв|ін|ин|іна|ина|ова|ева|єва|ко|як|ак|ець|ец|ич|ій|ый|ая)$/i;

const CYRILLIC_WORD = /^[\p{Script=Cyrillic}][\p{Script=Cyrillic}'’-]{2,}$/u;
const LATIN_WORD = /^[A-Z][a-z]{2,}$/;

// Trade words that end exactly like surnames: "массажистов", "Лечебный",
// "Професійний", "УКРАИНА". Without this the suffix rule reads a service line
// as a family. The caller adds the sweep's own service and place words on top.
const NOT_A_NAME = [
  'масс', 'мас', 'массаж', 'терап', 'реабіліт', 'реабилит', 'остеопат', 'космет',
  'лечебн', 'лікувальн', 'оздоров', 'подготов', 'підготов', 'навчан', 'обучен',
  'профес', 'профис', 'автор', 'сертиф', 'апарат', 'аппарат', 'ручн', 'класич',
  'классич', 'спортив', 'домашн', 'україн', 'украин', 'ukrain', 'студ', 'центр',
  'салон', 'клінік', 'клиник', 'краса', 'красот', 'beauty', 'massage',
];

/**
 * Look for a person's name in a display name.
 *
 * Returns the matched token, or an empty string. Only the part before the
 * first separator is considered — Instagram display names are usually
 * "Name | service | city", and the service half is full of words that end
 * like surnames ("Одеса", "масажист").
 *
 * `stop` takes the sweep's own service and place stems, because what is a
 * trade word depends on the trade being swept.
 */
export function personalName(fullName = '', stop = []) {
  const banned = [...NOT_A_NAME, ...stop.map((s) => s.toLowerCase())];
  const head = fullName.split(/[|•·/,\\]|\s[-–—]\s/)[0];
  const words = head
    .replace(/[^\p{L}\s'’-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const clean = (word) => {
    const bare = word.toLowerCase();
    return banned.some((s) => bare.includes(s)) ? '' : bare;
  };

  for (const word of words.slice(0, 3)) {
    const bare = clean(word);
    if (bare && GIVEN.has(bare)) return word;
  }
  for (const word of words.slice(0, 3)) {
    if (!CYRILLIC_WORD.test(word) && !LATIN_WORD.test(word)) continue;
    if (word.length < 5 || !clean(word)) continue;
    if (SURNAME.test(word)) return word;
  }
  return '';
}
