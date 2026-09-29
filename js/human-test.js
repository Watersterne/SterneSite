/* ============================================================================
 * 同路人 · 人格测试 —— 数据与算法
 *
 * 来源：E:\Desktop\HumanTest（engine.js / index.html 内嵌副本，v1.0.0）
 * 本文件为原实现的等价移植：题库、人物库、文案、计分与匹配算法逐行保留，
 * 未做任何算法改动，保证结果与原版一致。
 *
 * 唯一改动：雷达图 SVG 原本把颜色写死在属性里，现改为输出 CSS 类
 * （.ring/.spoke/.rlabel/.r-user/.r-fig），由 tool-human.html 的样式按主题着色。
 *
 * 零依赖、零网络请求、零状态持久化。全部计算在浏览器本地完成。
 * ========================================================================== */
(function () {
    'use strict';

    /* =========================================================
       维度定义
       ========================================================= */
    var DIMS = [
        { k: 'acuity', n: '觉察', lo: '疏阔', hi: '深察', q: '对细节与暗流的敏感度' },
        { k: 'tempo',  n: '决断', lo: '谋定', hi: '决行', q: '从想到到动手的速度' },
        { k: 'firm',   n: '持守', lo: '通变', hi: '守节', q: '对原则与底线的坚持度' },
        { k: 'polar',  n: '气象', lo: '沉潜', hi: '外拓', q: '能量向内还是向外' },
        { k: 'ideal',  n: '心志', lo: '务实', hi: '理想', q: '做选择时更看值得还是划算' },
        { k: 'form',   n: '行止', lo: '循矩', hi: '破格', q: '对规矩与先例的态度' }
    ];

    /* =========================================================
       题库：每维 4 题，第 2、4 题为反向题（避免"什么都同意"的作答偏差）
       ========================================================= */
    var BANK = {
        acuity: [
            '别人一句话里语气的变化，我常常第一时间就察觉到。',
            '一件事的大方向和细节，我一般更在意前者。',
            '我容易记住别人忽略的小事——日期、表情、当时的原话。',
            '我很少注意到身边环境的细微变化。'
        ],
        tempo: [
            '事情想清楚七八分，我就能动手，不必等到万全。',
            '做重要决定前，我总要反复权衡很久。',
            '别人还在讨论的时候，我已经开始试了。',
            '我常常拖到最后期限，才不得不做选择。'
        ],
        firm: [
            '就算吃了亏，我也不太愿意在原则问题上让步。',
            '为了把事办成，我可以放下一些自己原本的坚持。',
            '认定是对的事，我很难因为别人都反对而放弃。',
            '我比较能接受"到什么山唱什么歌"。'
        ],
        polar: [
            '我喜欢把想法说出来，让更多人听见。',
            '我更喜欢把事做完再说，不太愿意中途讲出去。',
            '一个人待久了，我会想出去见人、出去闯。',
            '我更愿意在一件熟悉的事上深耕，而不是不断换新的。'
        ],
        ideal: [
            '做一件事，我首先问它值不值得，而不是划不划算。',
            '做选择时，我更看重实际能得到什么。',
            '有些"不现实"的东西，我一直没舍得放下。',
            '我不太会被"意义"打动，能落地才重要。'
        ],
        form: [
            '只要结果对，我不太在意是不是按老规矩来。',
            '我觉得按既定流程做事，比临时发挥更可靠。',
            '别人说"一直都是这么做的"，反而让我想换个做法。',
            '我不喜欢做没有先例的事。'
        ]
    };

    /* 交错出题：第 1 轮 6 个维度各 1 题，共 4 轮 —— 避免同维度连问 */
    var QUESTIONS = [];
    for (var r = 0; r < 4; r++) {
        DIMS.forEach(function (d) {
            QUESTIONS.push({ dim: d.k, text: BANK[d.k][r], rev: r % 2 === 1 });
        });
    }

    var OPTS = [
        { v: 1, t: '很不同意' },
        { v: 2, t: '不太同意' },
        { v: 3, t: '说不上' },
        { v: 4, t: '比较同意' },
        { v: 5, t: '很同意' }
    ];

    /* =========================================================
       历史人物库
       traits 顺序：[觉察, 决断, 持守, 气象, 心志, 行止]
       0 = 偏"疏阔/谋定/通变/沉潜/务实/循矩"，100 = 偏"深察/决行/守节/外拓/理想/破格"
       ========================================================= */
    var FIGURES = [
        { name: '诸葛亮', era: '三国 · 蜀汉', life: '181 – 234', title: '谋定而后动的人', traits: [92, 25, 90, 35, 95, 40],
          feat: ['官至蜀汉丞相，封武乡侯', '定三分天下，为最弱的一方续命十一年'],
          portrait: '你做事之前，习惯先把所有变量摆到桌面上。别人看你慢，其实你在心里已经推演过三遍。你不太相信运气，更相信准备。',
          low: '刘备死后，蜀汉是三国里最弱的一方。他明知北伐胜算不大，还是六出祁山——不是看不清局势，是看清了还要做。',
          ground: '需要一个能替所有人兜底的场合。越是复杂的系统，你越能把每一环扣上。',
          words: '你不需要更快。你需要的是把慢下来的那些时间，变成别人算不到的东西。',
          tags: ['深察', '守节', '理想', '谋定'] },

        { name: '苏轼', era: '北宋', life: '1037 – 1101', title: '越贬越开阔的人', traits: [80, 55, 75, 88, 82, 62],
          feat: ['官至礼部尚书、端明殿学士', '唐宋八大家之一', '知杭州时疏浚西湖，筑成苏堤'],
          portrait: '你对世界的感受力很强，一点小事就能让你高兴，也让你难过。但你有一样别人少有的本事：不管被扔到哪儿，都能重新长出生活的样子。',
          low: '乌台诗案差点要了他的命，之后一路被贬到黄州、惠州、儋州。最远的一次是被送到海南——在宋代，那几乎等于流放到了天边。',
          ground: '需要不断换环境、需要把苦日子过出滋味的场合。你适合做那种越折腾越有东西的人。',
          words: '你的敏感不是负担，它只是需要足够大的地方去放。',
          tags: ['外拓', '深察', '达观'] },

        { name: '王阳明', era: '明', life: '1472 – 1529', title: '在绝境里想通的人', traits: [88, 78, 85, 60, 95, 80],
          feat: ['官至南京兵部尚书', '平定宁王之乱', '创立心学，主张"知行合一"'],
          portrait: '你不满足于照做，总想问一句"为什么"。别人给的解释你不一定信，你要自己走一遍才算数。这种较真让你比别人晚开窍，但开窍之后就很难被动摇。',
          low: '被贬到贵州龙场，那地方在当时是瘴疠之地，随从都病倒了。他就是在那儿，把想不通的事想通了。',
          ground: '需要从零建立一套自己方法的时候。别人给你模板，你会把它拆了重建。',
          words: '道理不在书上，在你亲手撞过的那堵墙上。',
          tags: ['理想', '破格', '深察', '决行'] },

        { name: '司马迁', era: '西汉', life: '前145 – 约前86', title: '把屈辱熬成一部书的人', traits: [95, 30, 92, 25, 90, 45],
          feat: ['官至太史令', '著《史记》，开纪传体通史，上记三千年'],
          portrait: '你看事情看得很透，也因此比别人更容易受折磨。你不太擅长争辩，但心里有一条线，一旦认了，就愿意用很久很久去完成它。',
          low: '为李陵说话触怒汉武帝，受了宫刑。他本可以死，但他选择活着——因为那部书还没写完。',
          ground: '需要极长时间、极高标准的工作。你能忍受别人忍不了的过程。',
          words: '你要写的东西太大，所以命运要先把你压得很低。',
          tags: ['深察', '守节', '沉潜', '理想'] },

        { name: '屈原', era: '战国 · 楚', life: '约前340 – 前278', title: '不肯将就的人', traits: [90, 35, 98, 45, 98, 55],
          feat: ['官至楚国左徒、三闾大夫', '作《离骚》，开楚辞一体'],
          portrait: '你对"对错"的敏感度极高，高到有时候会让自己很难过。你不太会转弯，也不想学——因为在你看来，转弯本身就是问题。',
          low: '被楚王疏远、两次流放。他看着楚国一步步走向灭亡却什么都做不了，最后自沉汨罗江。',
          ground: '需要一个底线清晰、不允许含糊的场合。你是那种可以托付原则的人。',
          words: '你守的东西也许暂时没人要，但总有人会记得你守过。',
          tags: ['守节', '理想', '深察'] },

        { name: '曹操', era: '东汉末 · 魏', life: '155 – 220', title: '把乱局当棋盘的人', traits: [88, 88, 45, 92, 55, 82],
          feat: ['官至丞相，封魏王', '统一北方', '行屯田制，开建安风骨'],
          portrait: '你判断形势很快，不太被情面绑住。别人还在纠结该不该做，你已经做完了，并且在想下一步。你不是没有底线，只是你的底线是"把事办成"。',
          low: '赤壁一把火，把统一天下的机会烧没了。他此后终身未能南下。',
          ground: '局面混乱、规则失效的时候。越是别人不敢动的时候，你越清楚该往哪儿走。',
          words: '乱世里最贵的不是勇气，是判断。',
          tags: ['决行', '外拓', '破格', '通变'] },

        { name: '刘邦', era: '西汉', life: '前256 – 前195', title: '知道自己不行，所以能行的人', traits: [70, 82, 35, 90, 45, 80],
          feat: ['西汉开国皇帝', '灭秦破楚，奠四百年汉家基业'],
          portrait: '你不太在意面子，也不太执着于"必须由我来做"。你能坦然承认别人比自己强，然后把他们放到对的位置上。这是一种很罕见的能力。',
          low: '彭城之战五十六万大军被项羽三万骑兵打崩，父亲和妻子都成了俘虏。他从头再来。',
          ground: '需要整合一群人、需要做决断却不抢功的场合。',
          words: '你不必什么都会，你只要知道谁会用。',
          tags: ['外拓', '决行', '通变', '破格'] },

        { name: '陶渊明', era: '东晋', life: '365 – 427', title: '主动退出的人', traits: [78, 30, 92, 18, 92, 85],
          feat: ['一生只做到彭泽令，八十余日便辞官', '开田园诗一派，作《桃花源记》'],
          portrait: '你不喜欢被安排，也不喜欢为了位置去说违心的话。别人觉得你清高，其实你只是算过账：那点好处，不值得你把日子过成那样。',
          low: '做了八十多天彭泽令，郡里派督邮来检查，要他束带迎接。他说"吾不能为五斗米折腰"，当天辞官回家。',
          ground: '需要一个不打扰你的场合。你适合把力气用在自己真正认的事情上。',
          words: '你放弃的不是前途，是一种不适合你的活法。',
          tags: ['沉潜', '守节', '破格', '理想'] },

        { name: '李白', era: '唐', life: '701 – 762', title: '不肯收敛的人', traits: [72, 75, 62, 98, 88, 92],
          feat: ['官至供奉翰林', '存诗九百余首，唐人称为"诗仙"'],
          portrait: '你的能量往外冒，很难被装进一个格子里。你不喜欢被管，也不喜欢重复。你要的是"尽兴"，哪怕代价是长久的不稳定。',
          low: '一辈子想当官做大事，却始终只是个"供奉翰林"，写诗助兴。晚年还因站错队被流放夜郎。',
          ground: '需要感染力、需要把气氛打开、需要别人被点燃的场合。',
          words: '你的问题是太亮。但这不是需要改的问题。',
          tags: ['外拓', '破格', '理想'] },

        { name: '杜甫', era: '唐', life: '712 – 770', title: '替所有人难过的人', traits: [96, 30, 85, 40, 92, 48],
          feat: ['官至检校工部员外郎', '诗作被称"诗史"，后世尊为诗圣'],
          portrait: '你对别人的处境特别敏感，甚至比当事人还敏感。你会记住一个陌生人当时的表情，很多年。这种心肠让你写得出好东西，也让你活得比别人沉。',
          low: '安史之乱里，他丢了官，带着家人一路逃难，幼子饿死。后半生基本在漂泊和病痛中度过。',
          ground: '需要共情、需要替沉默的人说话、需要把复杂处境讲清楚的场合。',
          words: '你能感受到的苦，是你后来能写下来的东西。',
          tags: ['深察', '守节', '理想', '沉潜'] },

        { name: '曾国藩', era: '清', life: '1811 – 1872', title: '用笨功夫走远路的人', traits: [88, 22, 92, 45, 82, 42],
          feat: ['官至两江总督、武英殿大学士，封一等毅勇侯', '组湘军平太平天国', '开洋务运动之先'],
          portrait: '你不相信捷径，也不太相信天赋。你相信的是每天做一点、不中断。你做事比别人慢，但很少翻车——因为你把该想的都想过了。',
          low: '靖港、湖口两次兵败，他都投水自尽，被部下救起。那几年他给皇帝的奏折里写"臣屡败屡战"。',
          ground: '需要长期稳定输出、需要有人扛住不崩的场合。',
          words: '结硬寨，打呆仗。慢，但是不输。',
          tags: ['谋定', '守节', '深察', '沉潜'] },

        { name: '王安石', era: '北宋', life: '1021 – 1086', title: '认准了就不回头的人', traits: [82, 82, 95, 70, 95, 80],
          feat: ['官至宰相', '推行熙宁变法，改青苗、募役、保甲诸法'],
          portrait: '你一旦认定某件事是对的，就会一直往前推，别人的反对只会让你更坚定。这种意志力能推动大事，也容易让你和整个世界硬碰。',
          low: '变法遭到几乎所有人的反对，两次罢相，最后新法被全部废除。他死在江宁，生前看到自己的心血被推翻。',
          ground: '需要一个由你主导、需要强行推动改革的场合。',
          words: '拗不是缺点。世界只会被拗得动的人推动。',
          tags: ['守节', '理想', '决行', '破格'] },

        { name: '张居正', era: '明', life: '1525 – 1582', title: '把制度当手术刀的人', traits: [88, 85, 78, 68, 72, 75],
          feat: ['官至内阁首辅、太师', '行"一条鞭法""考成法"，成万历中兴'],
          portrait: '你不满足于修补表面，你要动的是结构。你看得出哪个环节在拖后腿，也敢直接切。你对效率的追求，超过对人情世故的顾虑。',
          low: '生前权倾朝野，死后被抄家，长子自尽，家人流放，改革成果大半被废。',
          ground: '一个庞大组织需要提效的时候。你是那种敢动手术的人。',
          words: '你要改的不是人，是那套让人不得不那样做的规矩。',
          tags: ['决行', '深察', '破格', '务实'] },

        { name: '玄奘', era: '唐', life: '602 – 664', title: '一个人走了十七年的人', traits: [90, 45, 96, 55, 96, 55],
          feat: ['终身不受官职', '西行十七年取回梵典', '译经七十五部，著《大唐西域记》'],
          portrait: '你有一个别人看来不划算的目标，而且你不打算放弃它。你不喜欢声张，也不需要同伴，你只是每天往前走一点，走很久。',
          low: '偷渡出关，穿越八百里流沙，水囊打翻、几乎渴死在戈壁。到天竺后又被卷进当地政局。',
          ground: '需要一个人扛很长时间、没人给你即时反馈的场合。',
          words: '宁向西而死，不向东而生。方向对了，慢就慢吧。',
          tags: ['守节', '理想', '深察', '沉潜'] },

        { name: '徐霞客', era: '明', life: '1587 – 1641', title: '把一生走成地图的人', traits: [88, 60, 85, 82, 80, 90],
          feat: ['布衣终身', '著《徐霞客游记》，最早记录石灰岩溶洞地貌'],
          portrait: '你对"没去过的地方"有种按不住的冲动，对功名反而没什么兴趣。你相信亲眼看到的东西，不相信转述。',
          low: '最后一次远行途中病倒，被人抬回家乡，第二年去世。他走坏了双腿，也没能走完计划中的路。',
          ground: '需要实地、需要一手信息、需要有人愿意亲自去看的场合。',
          words: '你自己走过的路，才是你的。',
          tags: ['外拓', '破格', '深察'] },

        { name: '李时珍', era: '明', life: '1518 – 1593', title: '用二十七年改一本书的人', traits: [95, 28, 90, 42, 85, 55],
          feat: ['三试不中，弃儒从医', '著《本草纲目》，收药一千八百九十二种'],
          portrait: '你受不了"大概是这样"。别人说差不多就行，你偏要查到底。这种性格让你做起事来特别慢，但做出来的东西别人放心。',
          low: '考了三次举人都没中，后来放弃科举从医。写《本草纲目》的二十七年里没有官方支持，全靠自己走山采药。',
          ground: '需要核对、需要纠错、需要把一件事做到可以传下去的场合。',
          words: '你花的那些"多余"的时间，正是别人做不到的部分。',
          tags: ['深察', '守节', '沉潜', '理想'] },

        { name: '班超', era: '东汉', life: '32 – 102', title: '扔下笔就走的人', traits: [78, 92, 80, 92, 68, 85],
          feat: ['官至西域都护，封定远侯', '经营西域三十年，使五十余国归附'],
          portrait: '你不甘于只做纸上的事，你想亲手去改变局面。你胆子大，但胆子不是莽——你是在极短的时间里算出风险，然后赌。',
          low: '出使鄯善时匈奴使者刚到，形势逆转。他当夜带三十六人火烧匈奴营帐，说"不入虎穴，焉得虎子"。三十一年后才回中原。',
          ground: '需要现场决断、需要有人敢在没授权的时候动手的场合。',
          words: '想清楚了就动手。犹豫才是最贵的成本。',
          tags: ['决行', '外拓', '破格', '守节'] },

        { name: '苏武', era: '西汉', life: '前140 – 前60', title: '在北海边上等十九年的人', traits: [70, 30, 99, 35, 90, 50],
          feat: ['官至典属国', '持节北海牧羊十九年，图形麒麟阁'],
          portrait: '你有一种近乎固执的忠诚——对承诺、对身份、对你自己认定的事。你不擅长变通，也不想变通。别人说你死板，你说那是底线。',
          low: '出使匈奴被扣，流放到北海牧羊，说"公羊生子"才放他回去。他掘野鼠、啃草籽活了十九年，手里一直握着那根汉节。',
          ground: '需要一个绝对可靠的人守在那里的时候。你在，别人就放心。',
          words: '你守的那根节，可能到最后都没人看见。但你自己看得见。',
          tags: ['守节', '理想', '沉潜'] },

        { name: '谢安', era: '东晋', life: '320 – 385', title: '大敌当前还在下棋的人', traits: [85, 45, 75, 55, 70, 60],
          feat: ['官至太保', '淝水之战以八万破前秦大军'],
          portrait: '你看起来从容，其实脑子里一直在算。你不太喜欢表现紧张，也不喜欢把情绪传给别人。越到关键时刻，你越安静。',
          low: '四十岁前一直隐居东山，被人说"不出山，天下怎么办"。出仕后面对前秦百万大军，东晋只有八万，他照样下棋。',
          ground: '需要稳定军心、需要有人在慌乱的场合保持清醒的时候。',
          words: '你的镇定不是不怕，是你知道慌没有用。',
          tags: ['深察', '守节', '沉潜'] },

        { name: '郭子仪', era: '唐', life: '697 – 781', title: '功高而不倒的人', traits: [82, 55, 68, 72, 70, 55],
          feat: ['官至太尉、中书令，封汾阳郡王', '平安史之乱，收复两京'],
          portrait: '你能力强，但更难得的是你知道什么时候退。你不太争，也不太解释，你相信把事情做扎实比赢得争论更重要。',
          low: '安史之乱后被夺兵权、闲置多年，又屡次被召回。他从不抱怨，召之即来，挥之即去。',
          ground: '需要一个能长久待在一个位置上、不被嫉妒掀翻的场合。',
          words: '你不必赢过所有人，你只需要一直在。',
          tags: ['深察', '守节', '通变'] },

        { name: '范仲淹', era: '北宋', life: '989 – 1052', title: '先天下之忧而忧的人', traits: [85, 60, 90, 70, 95, 55],
          feat: ['官至参知政事', '主持庆历新政', '戍边御西夏，作《岳阳楼记》'],
          portrait: '你做事的出发点很少是自己。你会有一种说不清的责任感，觉得有些事"总得有人做"，然后就去做，不管划不划算。',
          low: '庆历新政推行一年多即被废止，他被贬出京。此后辗转各地，始终没能回到权力中心。',
          ground: '需要一个有信念支撑、能长期扛责任的场合。',
          words: '你操心的事比你该操心的大，这大概就是你的命。',
          tags: ['理想', '守节', '外拓', '深察'] },

        { name: '司马光', era: '北宋', life: '1019 – 1086', title: '十九年只做一件事的人', traits: [92, 25, 95, 38, 85, 35],
          feat: ['官至尚书左仆射', '主编《资治通鉴》，贯穿一千三百六十二年'],
          portrait: '你对"该怎么做"有一套很稳的判断，而且不太容易被说服改变。你相信积累胜过聪明，相信把一件事做完整比做很多事重要。',
          low: '因反对新法离开朝廷，退居洛阳十五年。就在那十五年里，他写完了《资治通鉴》。',
          ground: '需要长期投入、需要有人守住标准不让它滑坡的场合。',
          words: '你不需要灵感，你需要的是十九年。',
          tags: ['谋定', '守节', '深察', '循矩'] },

        { name: '韩愈', era: '唐', life: '768 – 824', title: '敢一个人对抗风气的人', traits: [82, 72, 92, 68, 90, 70],
          feat: ['官至吏部侍郎', '倡古文运动，苏轼称其"文起八代之衰"'],
          portrait: '你说话直，看不得不对的事，也不太会挑时机。你知道这样会得罪人，但你还是说——因为不说你更难受。',
          low: '因上《论佛骨表》触怒宪宗，差点被处死，最后贬到潮州。八个月后又被召回，他该说的还是照说。',
          ground: '需要一个敢说真话、需要有人把标准立起来的场合。',
          words: '你一个人站在那里的时候，风气就开始变了。',
          tags: ['守节', '理想', '决行', '破格'] },

        { name: '刘禹锡', era: '唐', life: '772 – 842', title: '被贬二十三年还嘴硬的人', traits: [78, 60, 90, 65, 78, 72],
          feat: ['官至太子宾客', '参与永贞革新', '采巴渝民歌入诗，作《竹枝词》'],
          portrait: '你不太会低头，也不觉得该低头。别人劝你圆一点，你偏不——不是不懂，是不愿意。你把"不改"当成一件值得的事。',
          low: '因参与永贞革新被贬，前后二十三年。被召回京后又写诗讽刺权贵，再次被贬到更远的地方。',
          ground: '需要一个不容易被环境同化的场合。你会是那个把标准保住的人。',
          words: '二十三年弃置身。但你回来的时候，还是你。',
          tags: ['守节', '破格', '沉潜'] },

        { name: '李清照', era: '宋', life: '1084 – 约1155', title: '把心事写成词的人', traits: [96, 45, 82, 45, 82, 78],
          feat: ['号易安居士', '提出"词别是一家"', '后人推为婉约词宗'],
          portrait: '你的感受极其细腻，细微的东西在你这儿会被放大。你不怕说自己的情绪，也能把它说得准确。这让你比别人更真，也更累。',
          low: '靖康之变后南渡，丈夫病逝，收藏的金石书画散失殆尽。晚年改嫁又诉讼离异，在当时的舆论里承受了极大的非议。',
          ground: '需要精确表达、需要把复杂感受翻译成别人听得懂的话的场合。',
          words: '你把难过写清楚了，它就成了别人的安慰。',
          tags: ['深察', '守节', '破格', '理想'] },

        { name: '辛弃疾', era: '南宋', life: '1140 – 1207', title: '一生想上战场的人', traits: [82, 88, 88, 78, 92, 72],
          feat: ['官至龙图阁待制', '二十一岁率五十骑闯金营擒叛将', '豪放词的代表'],
          portrait: '你身上有一股憋着的劲，想做一件大事。你能等，但等得很不甘心。你不太会掩饰自己的志向，也不太愿意把它换成别的东西。',
          low: '二十一岁率五十骑闯金营擒叛将，此后四十多年却基本被闲置、调来调去，再没打过仗。他把那些劲全写进了词里。',
          ground: '需要一个可以发力、目标明确的场合。没有战场的时候，你需要自己找一个。',
          words: '你没打成的那些仗，会在别的地方打。',
          tags: ['决行', '守节', '理想', '外拓'] },

        { name: '岳飞', era: '南宋', life: '1103 – 1142', title: '把规矩和热血放在一起的人', traits: [80, 82, 95, 65, 95, 50],
          feat: ['官至枢密副使', '四次北伐，郾城大捷', '金人叹"撼山易，撼岳家军难"'],
          portrait: '你既有强烈的是非观，又有极强的执行力。你不喜欢含糊，也不喜欢妥协。你相信只要方向对、纪律严，就没有打不赢的仗。',
          low: '郾城大捷后被十二道金牌召回，以"莫须有"的罪名下狱，三十九岁被害于风波亭。',
          ground: '需要一个纪律和信念同样重要的场合。',
          words: '你守的规矩和你流的血，是同一件事。',
          tags: ['守节', '理想', '决行'] },

        { name: '文天祥', era: '南宋', life: '1236 – 1283', title: '到最后也不肯写降书的人', traits: [82, 55, 99, 55, 98, 55],
          feat: ['官至右丞相兼枢密使', '被囚大都三年不降', '作《正气歌》《过零丁洋》'],
          portrait: '你把"做什么样的人"看得比"活着"更重。你不是不知道退路，你只是不接受。这种性格让你很难被利用，也很难被理解。',
          low: '兵败被俘，囚于大都三年。元朝许以宰相之位，他写下《过零丁洋》后从容就义，四十七岁。',
          ground: '需要一个象征、需要有人代表一个群体站着的时候。',
          words: '人生自古谁无死。你早就把账算清楚了。',
          tags: ['守节', '理想', '深察'] },

        { name: '海瑞', era: '明', life: '1514 – 1587', title: '把规矩当命的人', traits: [88, 70, 99, 45, 92, 60],
          feat: ['官至南京右都御史', '上疏直斥嘉靖帝', '巡抚应天，疏浚吴淞江'],
          portrait: '你对规则有种近乎偏执的认真，而且对自己比对别人更狠。你不怕得罪人，也不在乎自己吃亏，你只在乎这件事对不对。',
          low: '上《治安疏》痛骂嘉靖帝，事先买好棺材、遣散家人。入狱后差点被处死。做官几十年，屡起屡罢。',
          ground: '需要一个不给自己留退路、需要有人把底线钉死的地方。',
          words: '你得罪的是人，守的是规矩。规矩比你活得久。',
          tags: ['守节', '理想', '深察', '决行'] },

        { name: '曹雪芹', era: '清', life: '1715 – 1763', title: '把一生写进一本书的人', traits: [97, 30, 80, 35, 88, 82],
          feat: ['家族被抄没，举家食粥酒常赊', '著《红楼梦》，中国古典小说之巅'],
          portrait: '你的感受力异于常人，能同时看见很多层。你不太适应世俗的竞争，也不太愿意为了生计委屈自己的东西。你把所有力气都留给了那一件事。',
          low: '家族被抄没，从锦衣玉食跌到"举家食粥酒常赊"。写了十年，书没写完，儿子夭折，自己在贫病中去世。',
          ground: '需要极致的感受力和耐心、需要把复杂的东西写下来的场合。',
          words: '你受的那些，最后都会变成你的东西。',
          tags: ['深察', '理想', '破格', '沉潜'] },

        { name: '蒲松龄', era: '清', life: '1640 – 1715', title: '在路边摆茶摊听故事的人', traits: [92, 35, 78, 30, 85, 78],
          feat: ['终身未中举，以塾师终老', '著《聊斋志异》，成书近五百篇'],
          portrait: '你对人身上的故事有极强的兴趣，尤其是那些说不出口的部分。你自己过得不算顺，但你愿意一直听、一直记。',
          low: '十九岁考中秀才，之后乡试屡试不中，考到七十多岁。一生在乡下做塾师，穷困潦倒。',
          ground: '需要观察人、需要把民间的东西收集整理出来的场合。',
          words: '你没考上的那些功名，换来了另一本书。',
          tags: ['深察', '理想', '沉潜', '破格'] },

        { name: '顾炎武', era: '清初', life: '1613 – 1682', title: '走遍天下做学问的人', traits: [90, 55, 90, 65, 88, 72],
          feat: ['明亡后终身不仕清', '著《日知录》，开清代考据学先河'],
          portrait: '你不相信纸上得来的结论，也不喜欢空谈。你要亲眼看过、亲手核过才敢写。你的认真里带着一种责任，觉得做学问是要拿来用的。',
          low: '明亡后拒不仕清，四处奔走抗清，两次入狱。后半生二十多年漂泊北方，靠考察和著述度日。',
          ground: '需要把知识变成能落地的东西、需要有人实地核实的场合。',
          words: '天下兴亡，匹夫有责。你把这句话做成了自己的活法。',
          tags: ['深察', '守节', '外拓', '理想'] },

        { name: '管仲', era: '春秋 · 齐', life: '约前723 – 前645', title: '不讲虚的，只讲管用的人', traits: [85, 72, 40, 78, 55, 80],
          feat: ['官至齐国上卿', '辅齐桓公九合诸侯，成春秋首霸'],
          portrait: '你判断事情的标准很直接：有没有用。你不被道德说辞绕进去，也不太在意别人怎么评价你。你能在很复杂的局面里找到那条最实际的路。',
          low: '早年穷困，经商失败，打仗当逃兵，辅佐的公子纠被杀后还做了政敌的囚徒。是鲍叔牙把他举荐给了齐桓公。',
          ground: '需要把资源盘活、需要务实解法、需要有人敢打破旧例的场合。',
          words: '你不需要名声，你需要一个能让你做事的人。',
          tags: ['通变', '破格', '决行', '务实'] },

        { name: '张良', era: '西汉', life: '约前250 – 前186', title: '算得准，也退得干净的人', traits: [92, 40, 68, 42, 72, 70],
          feat: ['封留侯', '运筹帷幄，助刘邦定天下', '功成后主动退隐'],
          portrait: '你习惯在别人看不见的地方推演，很少冲到台前。你知道什么时候该出手，更知道什么时候该走——这后一种能力，比前一种更少见。',
          low: '早年博浪沙刺秦失败，亡命下邳。后来辅佐刘邦定天下，功成后主动退隐，说"愿弃人间事，欲从赤松子游"。',
          ground: '需要谋略、需要有人在幕后布局的场合。',
          words: '你算得比别人远，所以也该比别人先走。',
          tags: ['深察', '谋定', '通变', '沉潜'] },

        { name: '霍去病', era: '西汉', life: '前140 – 前117', title: '二十岁就把仗打完的人', traits: [72, 92, 70, 95, 70, 88],
          feat: ['官至大司马、骠骑将军，封冠军侯', '封狼居胥，打通河西走廊'],
          portrait: '你的爆发力极强，不喜欢按部就班。别人还在准备，你已经冲出去了。你不擅长忍耐和等待，你擅长的是在短时间内把结果拿到。',
          low: '二十四岁就病逝，一生极短。但他在极短的时间里，做到了别人一辈子做不到的事。',
          ground: '需要冲刺、需要打开局面、需要有人先冲一次的场合。',
          words: '你不必活得久。你只要在的时候足够亮。',
          tags: ['决行', '外拓', '破格'] },

        { name: '郑板桥', era: '清', life: '1693 – 1766', title: '难得糊涂的人', traits: [88, 62, 90, 58, 80, 92],
          feat: ['官至潍县知县', '"扬州八怪"代表人物', '诗、书、画并称三绝'],
          portrait: '你看得很清楚，但你不愿意活得太清楚。你对是非有底线，对形式却很随性。你身上有一种别人学不来的松弛——那不是不在意，是看透之后的放过。',
          low: '做了十二年县令，因为替灾民请赈得罪上司，罢官回乡。此后在扬州卖画为生。',
          ground: '需要一个既守得住底线、又不被规矩绑死的场合。',
          words: '聪明难，糊涂难，由聪明转入糊涂更难。',
          tags: ['深察', '守节', '破格'] },

        { name: '李贽', era: '明', life: '1527 – 1602', title: '跟整个时代唱反调的人', traits: [90, 65, 95, 60, 92, 98],
          feat: ['官至云南姚安知府', '著《焚书》《藏书》，反理学正统'],
          portrait: '你天生怀疑权威，别人觉得理所当然的东西，你偏要问一句凭什么。你不怕被孤立，甚至有点享受站在对立面——因为那让你觉得诚实。',
          low: '晚年被弹劾下狱，著作被焚。他在狱中自刎，两天后去世，七十六岁。',
          ground: '需要一个敢于质疑、需要有人打破共识的场合。',
          words: '你说的话当时没人接得住。但后来有人接了。',
          tags: ['破格', '守节', '理想', '深察'] },

        { name: '徐渭', era: '明', life: '1521 – 1593', title: '把才华和痛苦一起写下来的人', traits: [96, 60, 82, 50, 85, 92],
          feat: ['终身布衣，只做过幕僚', '开大写意花鸟一派', '作杂剧《四声猿》'],
          portrait: '你的感知极其锐利，能看见别人看不见的层次。这种锐利让你产出很高，也让你承受更多。你不太能被安慰，你只能把它做成东西。',
          low: '一生屡试不中，做幕僚时主人下狱，他多次自杀未遂，又因杀妻入狱七年。晚年穷困，靠卖画度日。',
          ground: '需要极强创造力、需要把复杂情绪转化成作品的场合。',
          words: '你的痛不是白受的，它在你的作品里活着。',
          tags: ['深察', '破格', '理想'] },

        { name: '沈括', era: '北宋', life: '1031 – 1095', title: '什么都要弄明白的人', traits: [95, 45, 62, 60, 70, 72],
          feat: ['官至三司使，总掌天下财计', '著《梦溪笔谈》', '最早记录地磁偏角'],
          portrait: '你对世界有极强的求知欲，看到什么都要问到底。你不满足于会用，你要知道为什么。这让你涉猎极广，也让你不太容易专注在一件事上。',
          low: '晚年因永乐城兵败被贬，之后隐居梦溪园。政治上一生起伏，《梦溪笔谈》是他在失意中写下的。',
          ground: '需要跨领域、需要把不同东西连起来的场合。',
          words: '你不需要只做一件事，你本来就是个能装很多事的人。',
          tags: ['深察', '破格', '外拓', '务实'] },

        { name: '卫青', era: '西汉', life: '？ – 前106', title: '立了大功还很低的人', traits: [78, 78, 72, 60, 62, 45],
          feat: ['官至大司马、大将军，封长平侯', '七次出击匈奴，收复河朔'],
          portrait: '你能力很强，但你不喜欢张扬。你把功劳分给别人，把责任留给自己。你不争，是因为你知道争来的东西不牢。',
          low: '出身骑奴，姐姐卫子夫入宫后才被提拔。打了一辈子胜仗，始终谨慎谦退，从不养士、不结党。',
          ground: '需要一个既能打仗又能让上级放心的位置。',
          words: '你不需要证明什么，你的战功已经说完了。',
          tags: ['决行', '守节', '循矩', '深察'] }
    ];

    /* =========================================================
       维度文案：优势 / 代价 / 适合的处境 / 共鸣短语
       ========================================================= */
    var DIM_TEXT = {
        acuity: {
            hi: { adv: '你能看见别人看不见的暗流，很多问题在爆发前就被你按住了。',
                  cost: '信息吃得太多，容易累；也容易把别人的情绪算在自己账上。',
                  where: '需要预判、需要读人、需要把关的场合。',
                  reso: '都对细节和暗流敏感' },
            lo: { adv: '你不被细节绊住，能迅速抓住主干往前走。',
                  cost: '有时会漏掉关键的暗示，需要有人帮你盯细节。',
                  where: '需要快速推进、需要抗干扰的场合。',
                  reso: '都不被细节绊住，先抓主干' }
        },
        tempo: {
            hi: { adv: '别人还在权衡，你已经拿到反馈了。',
                  cost: '可能低估后果，需要给自己留一次复盘。',
                  where: '窗口期短、需要试错速度的场合。',
                  reso: '都是想到了就先做的人' },
            lo: { adv: '你下的决定通常经得起事后检查。',
                  cost: '机会有时在你想清楚之前就走了。',
                  where: '容错低、需要一步到位的场合。',
                  reso: '都习惯把事情想透了再动' }
        },
        firm: {
            hi: { adv: '你是那种能被托付底线的人。',
                  cost: '容易和现实硬碰，也容易把关系弄僵。',
                  where: '需要长期信任、需要有人守住标准的场合。',
                  reso: '都在原则上不容易让步' },
            lo: { adv: '你能在复杂局面里找到那条走得通的路。',
                  cost: '有时会被人觉得不够坚定。',
                  where: '需要周旋、需要把事办成的场合。',
                  reso: '都懂得在现实里找那条走得通的路' }
        },
        polar: {
            hi: { adv: '你天生适合站在人多的地方，把事推出去。',
                  cost: '铺得太开，容易每件事都差一口气。',
                  where: '需要连接资源、需要开疆的场合。',
                  reso: '都需要一个更大的场面' },
            lo: { adv: '你能在一件事上待很久，直到把它做穿。',
                  cost: '好东西常常因为没人知道而被埋住。',
                  where: '需要长期积累、需要深耕的场合。',
                  reso: '都能在一件事上待很久' }
        },
        ideal: {
            hi: { adv: '你做的事有内核，能撑过没有回报的阶段。',
                  cost: '容易在现实回报上吃亏，也容易失望。',
                  where: '需要信念支撑的长期项目。',
                  reso: '都愿意为"值得"买单' },
            lo: { adv: '你判断形势准，不容易被空话带走。',
                  cost: '有时会因为太算得清，错过一些需要先相信的机会。',
                  where: '需要资源效率、需要落地的场合。',
                  reso: '都算得清现实这笔账' }
        },
        form: {
            hi: { adv: '你能跳出别人默认的框，找到新解法。',
                  cost: '容易被规则和上级消耗。',
                  where: '需要创新、需要打破僵局的场合。',
                  reso: '都不太在意按不按老规矩来' },
            lo: { adv: '你做事有章法，别人跟你配合成本低。',
                  cost: '在需要颠覆的时候，你可能会慢半拍。',
                  where: '需要稳定交付、需要规模的场合。',
                  reso: '都相信章法能把事情做稳' }
        }
    };

    /* =========================================================
       状态与工具
       ========================================================= */
    var state = { idx: 0, answers: new Array(24).fill(null), result: null };

    var $ = function (s) { return document.querySelector(s); };
    var el = function (t, c, h) {
        var n = document.createElement(t);
        if (c) n.className = c;
        if (h != null) n.innerHTML = h;
        return n;
    };
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

    /* 极性问题：偏离中位 6 分以内视为"居中"，不硬贴一个极性标签 */
    function poleInfo(v, d) {
        if (v >= 56) return { t: d.hi, mid: false };
        if (v <= 44) return { t: d.lo, mid: false };
        return { t: '居中', mid: true };
    }

    function show(id) {
        document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('on'); });
        $('#' + id).classList.add('on');
        window.scrollTo({ top: 0, behavior: 'auto' });
    }

    var toastTimer = null;
    function toast(msg) {
        var t = $('#toast');
        t.textContent = msg;
        t.classList.add('on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('on'); }, 1900);
    }

    /* =========================================================
       答题流程
       ========================================================= */
    function renderQuestion(dir) {
        var i = state.idx, q = QUESTIONS[i];
        var dim = DIMS.find(function (d) { return d.k === q.dim; });
        $('#q-idx').textContent = i + 1;
        $('#q-dim').textContent = dim.n;
        $('#q-no').textContent = '第 ' + (i + 1) + ' 问';
        $('#q-text').textContent = q.text;
        $('#q-prog').style.width = ((i) / QUESTIONS.length * 100) + '%';

        var box = $('#q-opts');
        box.innerHTML = '';
        OPTS.forEach(function (o) {
            var b = el('button', 'opt');
            b.type = 'button';
            b.innerHTML = '<span class="k">' + o.v + '</span><span>' + o.t + '</span>';
            if (state.answers[i] === o.v) b.classList.add('sel');
            b.addEventListener('click', function () { choose(o.v); });
            box.appendChild(b);
        });

        var body = $('#q-body');
        body.classList.remove('q-enter', 'rev');
        void body.offsetWidth;
        body.classList.add('q-enter');
        if (dir === -1) body.classList.add('rev');

        $('#btn-back').style.visibility = i === 0 ? 'hidden' : 'visible';
    }

    function choose(v) {
        state.answers[state.idx] = v;
        var nodes = document.querySelectorAll('.opt');
        nodes.forEach(function (n) { n.classList.remove('sel'); });
        nodes[v - 1].classList.add('sel');
        setTimeout(function () {
            if (state.idx < QUESTIONS.length - 1) { state.idx++; renderQuestion(1); }
            else { finish(); }
        }, 170);
    }

    /* =========================================================
       计分
       ========================================================= */
    function scoreUser() {
        var raw = {}; DIMS.forEach(function (d) { raw[d.k] = 0; });
        QUESTIONS.forEach(function (q, i) {
            var v = state.answers[i] || 3;
            var s = q.rev ? (6 - v) : v;   // 反向题翻转
            raw[q.dim] += (s - 1);         // 0 – 16
        });
        return DIMS.map(function (d) { return Math.round(raw[d.k] / 16 * 100); });
    }

    /* 中心化：抹掉"整体偏高/偏低"这个共同方向。
       否则凡是多数维度都偏高的人物（如刘邦），会仅凭这个共同分量就吃掉大量匹配。
       中心化后比较的是性格的「相对形状」——哪几处比你自己更突出，才是真正的特征。 */
    function center(a) {
        var m = a.reduce(function (x, y) { return x + y; }, 0) / a.length;
        return a.map(function (v) { return v - m; });
    }

    var FIG_C = FIGURES.map(function (f) { return center(f.traits); });

    function match(vec) {
        var u = center(vec);
        var nu = Math.sqrt(u.reduce(function (a, x) { return a + x * x; }, 0));
        var dmax = 100 * Math.sqrt(DIMS.length);
        var balanced = nu <= 6;                 // 六维几乎完全均衡

        /* 均衡型：没有任何突出维度可比较，形状余弦会退化成噪声。
           这时改用「离中庸最近」的绝对距离——找出最没有偏向的那类人。 */
        if (balanced) {
            return FIGURES.map(function (f) {
                var d = Math.sqrt(f.traits.reduce(function (a, v) { return a + Math.pow(v - 50, 2); }, 0));
                return { f: f, score: clamp(88 - d * 0.45, 40, 88), cos: 0 };
            }).sort(function (a, b) { return b.score - a.score; })
              .map(function (r, i) { return (i === 0 ? Object.assign(r, { balanced: true }) : r); });
        }

        return FIGURES.map(function (f, fi) {
            var fv = FIG_C[fi];
            var dot = 0, nf = 0, dist2 = 0;
            for (var i = 0; i < DIMS.length; i++) {
                dot += u[i] * fv[i];
                nf += fv[i] * fv[i];
                dist2 += Math.pow(u[i] - fv[i], 2);
            }
            var cos = nf > 0 ? dot / (nu * Math.sqrt(nf)) : 0;
            var shape = Math.pow((clamp(cos, -1, 1) + 1) / 2, 1.5);
            var near = 1 - Math.sqrt(dist2) / dmax;
            var score = 100 * (0.85 * shape + 0.15 * near);
            return { f: f, score: score, cos: cos };
        }).sort(function (a, b) { return b.score - a.score; });
    }

    /* 共鸣维度：双方偏离中位方向一致、且都不算轻微 */
    function resonances(vec, figTraits) {
        var u = vec.map(function (v) { return v - 50; });
        var fv = figTraits.map(function (v) { return v - 50; });
        var list = [];
        DIMS.forEach(function (d, i) {
            var a = u[i], b = fv[i];
            if (a * b > 0 && Math.min(Math.abs(a), Math.abs(b)) >= 11) {
                list.push({ dim: d, hi: a > 0, w: Math.abs(a) * Math.abs(b) });
            }
        });
        return list.sort(function (x, y) { return y.w - x.w; }).slice(0, 3);
    }

    /* =========================================================
       结果渲染
       ========================================================= */
    function finish() {
        var phrases = ['正在比对史册…', '正在寻找同频的人…', '正在翻到那一页…'];
        var pi = 0;
        $('#load-txt').textContent = phrases[0];
        $('#loading').classList.add('on');
        var iv = setInterval(function () {
            pi = (pi + 1) % phrases.length;
            $('#load-txt').textContent = phrases[pi];
        }, 520);

        setTimeout(function () {
            clearInterval(iv);
            state.result = buildResult();
            $('#loading').classList.remove('on');
            renderResult();
            show('scr-res');
        }, 1650);
    }

    function buildResult() {
        var vec = scoreUser();
        var ranked = match(vec);
        var top = ranked[0];
        var alts = ranked.slice(1, 4);
        var reso = resonances(vec, top.f.traits);
        var ex = DIMS.map(function (d, i) { return { d: d, v: vec[i], dev: Math.abs(vec[i] - 50) }; })
                     .sort(function (a, b) { return b.dev - a.dev; });
        return { vec: vec, ranked: ranked, top: top, alts: alts, reso: reso, ex: ex };
    }

    /* 雷达图：颜色交给 CSS（.ring/.spoke/.rlabel/.r-user/.r-fig），随主题切换 */
    function radarSVG(vec, figTraits) {
        var cx = 170, cy = 160, R = 112, N = DIMS.length;
        var pt = function (i, r) {
            var a = (-90 + i * (360 / N)) * Math.PI / 180;
            return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
        };
        var poly = function (vals, k) {
            return vals.map(function (v, i) {
                return pt(i, R * (v / 100) * k).map(function (n) { return n.toFixed(1); }).join(',');
            }).join(' ');
        };

        var rings = '';
        [0.25, 0.5, 0.75, 1].forEach(function (k) {
            /* 注意：类名不要用 main —— 全站 css/style.css 里有 .main{flex:1}，会误命中 */
            rings += '<polygon class="ring' + (k === 1 ? ' outer' : '') + '" points="' +
                     poly(new Array(N).fill(100), k) + '"/>';
        });
        var spokes = '', labels = '';
        for (var i = 0; i < N; i++) {
            var p = pt(i, R);
            spokes += '<line class="spoke" x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"/>';
            var lp = pt(i, R + 27);
            labels += '<text class="rlabel" x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 4).toFixed(1) +
                      '" text-anchor="middle">' + DIMS[i].n + '</text>';
        }

        return '' +
        '<div class="radar-box"><svg viewBox="0 0 340 320" role="img" aria-label="性格六维雷达图">' +
            rings + spokes + labels +
            '<polygon class="r-user" id="r-user" points="' + poly(vec, 0) + '"/>' +
            '<polygon class="r-fig" id="r-fig" points="' + poly(figTraits, 0) + '"/>' +
        '</svg></div>' +
        '<div class="rlegend">' +
            '<span><i style="background:var(--tlr-swatch)"></i>你</span>' +
            '<span><i class="dash"></i>' + state.result.top.f.name + '</span>' +
        '</div>';
    }

    function animateRadar() {
        var vec = state.result.vec, fig = state.result.top.f.traits;
        var cx = 170, cy = 160, R = 112, N = DIMS.length;
        var pt = function (i, r) {
            var a = (-90 + i * (360 / N)) * Math.PI / 180;
            return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
        };
        var poly = function (vals, k) {
            return vals.map(function (v, i) {
                return pt(i, R * (v / 100) * k).map(function (n) { return n.toFixed(1); }).join(',');
            }).join(' ');
        };
        var uEl = document.getElementById('r-user'), fEl = document.getElementById('r-fig');
        if (!uEl || !fEl) return;
        var t0 = performance.now(), dur = 780;
        var step = function (now) {
            var p = clamp((now - t0) / dur, 0, 1);
            var e = 1 - Math.pow(1 - p, 3);
            uEl.setAttribute('points', poly(vec, e));
            fEl.setAttribute('points', poly(fig, e));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function renderResult() {
        var vec = state.result.vec, top = state.result.top, alts = state.result.alts,
            reso = state.result.reso, ex = state.result.ex;
        var f = top.f;
        var sc = Math.round(top.score);
        var root = $('#scr-res');
        root.innerHTML = '';

        /* ---- Hero ---- */
        var hero = el('div', 'res-hero');
        hero.innerHTML =
            '<div class="eyebrow">史 册 中 与 你 同 频 的 人</div>' +
            '<h2 class="matchname">' + f.name + '</h2>' +
            '<div class="m-life">' + f.era + ' &nbsp;·&nbsp; ' + f.life + '</div>' +
            '<div class="score-wrap"><span class="score-num">' + sc + '<small>%</small></span></div>' +
            '<div class="score-lab">性格契合度</div>' +
            '<div class="mtitle">' + f.title + '</div>' +
            '<div class="feat">' +
                f.feat.map(function (s) { return '<span>' + s + '</span>'; }).join('<i>·</i>') +
            '</div>' +
            (top.balanced
                ? '<p class="balance-note">你的六维分布非常均衡，没有哪一维明显压过其他。所以这个结果更像「最接近的一位」，而不是「最像的一位」——那也是一种性格。</p>'
                : '');
        root.appendChild(hero);

        /* ---- 雷达图 ---- */
        var cRadar = el('div', 'card accent');
        cRadar.innerHTML = '<h3 class="sec-title">你的性格坐标</h3>' + radarSVG(vec, f.traits);
        root.appendChild(cRadar);

        /* ---- 维度条 ---- */
        var cDim = el('div', 'card');
        cDim.innerHTML = '<h3 class="sec-title">六 维 读 数</h3>';
        var rows = el('div', 'dimrow');
        DIMS.forEach(function (d, i) {
            var v = vec[i];
            var p = poleInfo(v, d);
            var it = el('div', 'dimitem');
            it.innerHTML =
                '<div class="top"><span class="nm">' + d.n + '<em' + (p.mid ? ' class="mid"' : '') + '>' + p.t + '</em></span>' +
                '<span class="vl">' + v + '</span></div>' +
                '<div class="track"><div class="mid"></div><div class="fill" data-w="' + v + '"></div></div>' +
                '<div class="poles"><span>' + d.lo + '</span><span>' + d.hi + '</span></div>';
            rows.appendChild(it);
        });
        cDim.appendChild(rows);
        root.appendChild(cDim);

        /* ---- 主人物卡 ---- */
        var cMain = el('div', 'card');
        cMain.innerHTML =
            '<h3 class="sec-title">' + f.name + ' 是什么样的人</h3>' +
            '<p>' + f.portrait + '</p>' +
            '<div class="kv" style="margin-top:20px"><div class="k">他撑过去的低谷</div><div class="v">' + f.low + '</div></div>' +
            '<div class="kv"><div class="k">他的性格用在了哪里</div><div class="v">' + f.ground + '</div></div>' +
            '<div class="kv"><div class="k">写给你的话</div><p class="quote">' + f.words + '</p></div>' +
            '<div class="tags">' + f.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>';
        root.appendChild(cMain);

        /* ---- 共鸣维度 ---- */
        if (reso.length) {
            var cR = el('div', 'card accent');
            cR.innerHTML = '<h3 class="sec-title">你 们 共 同 的 地 方</h3>';
            var box = el('div', 'reso');
            reso.forEach(function (rr) {
                var txt = DIM_TEXT[rr.dim.k][rr.hi ? 'hi' : 'lo'].reso;
                box.appendChild(el('div', 'reso-item',
                    '<span class="dot"></span><span class="t"><b>' + rr.dim.n + '</b> · ' + txt + '</span>'));
            });
            cR.appendChild(box);
            root.appendChild(cR);
        }

        /* ---- 其他同频者 ---- */
        var cAlt = el('div', 'card');
        cAlt.innerHTML = '<h3 class="sec-title">其 他 同 频 者</h3>';
        alts.forEach(function (a) {
            var d = el('div', 'alt');
            d.innerHTML =
                '<span class="an">' + a.f.name + '</span>' +
                '<span class="am"><span class="ar">' + a.f.title + '</span>' +
                '<span class="ab"><i data-w="' + Math.round(a.score) + '"></i></span></span>' +
                '<span class="as">' + Math.round(a.score) + '%</span>';
            cAlt.appendChild(d);
        });
        root.appendChild(cAlt);

        /* ---- 性格说明书 ---- */
        var cMan = el('div', 'card');
        cMan.innerHTML = '<h3 class="sec-title">你 的 性 格 说 明 书</h3>';
        var grid = el('div', 'man-grid');

        if (top.balanced) {
            grid.appendChild(el('div', 'man-row good',
                '<span class="ico">优</span><span class="tx"><b>六维无短板</b>：你没有明显压过其他的一维。这种人适应面最宽，也最难被一句话定义。</span>'));
            grid.appendChild(el('div', 'man-row good',
                '<span class="ico">优</span><span class="tx"><b>不被性格推着走</b>：别人被自己的脾气牵着的时候，你还有余地去选择怎么应对。</span>'));
            grid.appendChild(el('div', 'man-row warn',
                '<span class="ico">注</span><span class="tx"><b>缺少天然的发力点</b>：均衡的代价是没有一处会自己冒出来。你需要主动挑一个方向去压重，而不是等性格替你选。</span>'));
            grid.appendChild(el('div', 'man-row warn',
                '<span class="ico">注</span><span class="tx"><b>容易被当成"没有特点"</b>：你的优势要靠长期表现才看得出来，短时间内容易被低估。</span>'));
            grid.appendChild(el('div', 'man-row good',
                '<span class="ico">位</span><span class="tx"><b>你适合的处境</b>：需要统筹、需要在多方之间保持判断的场合。<em>你不是某一种人，你是那个能让别人各自发挥的人。</em></span>'));
        } else {
            /* 近中位的维度（|偏差| < 6）没有明确极性，优先跳过；不足 3 个才按倾斜方向取文案。
               DIM_TEXT 只有 hi / lo 两套，绝不能用"居中"去索引。 */
            var polarized = ex.filter(function (e) { return Math.abs(e.v - 50) >= 6; });
            var pool = polarized.length >= 3 ? polarized : ex;
            pool.slice(0, 3).forEach(function (e) {
                var pole = e.v >= 50 ? 'hi' : 'lo';
                grid.appendChild(el('div', 'man-row good',
                    '<span class="ico">优</span><span class="tx"><b>' + e.d.n + '（' + (pole === 'hi' ? e.d.hi : e.d.lo) + '）</b>：' + DIM_TEXT[e.d.k][pole].adv + '</span>'));
            });
            pool.slice(0, 2).forEach(function (e) {
                var pole = e.v >= 50 ? 'hi' : 'lo';
                grid.appendChild(el('div', 'man-row warn',
                    '<span class="ico">注</span><span class="tx"><b>' + e.d.n + '</b> 要留意：' + DIM_TEXT[e.d.k][pole].cost + '</span>'));
            });
            var topDim = pool[0];
            grid.appendChild(el('div', 'man-row good',
                '<span class="ico">位</span><span class="tx"><b>你适合的处境</b>：' + DIM_TEXT[topDim.d.k][topDim.v >= 50 ? 'hi' : 'lo'].where + '<em>在那里，你身上最突出的这一点不是毛病，是硬通货。</em></span>'));
        }
        cMan.appendChild(grid);
        root.appendChild(cMan);

        /* ---- 底部操作 ---- */
        var acts = el('div', 'res-actions');
        var b1 = el('button', 'btn ghost', '复制结果文案');
        b1.type = 'button';
        b1.addEventListener('click', copyShare);
        var b2 = el('button', 'btn ghost', '重新测一次');
        b2.type = 'button';
        b2.addEventListener('click', restart);
        acts.appendChild(b1); acts.appendChild(b2);
        root.appendChild(acts);

        var tip = el('p', 'foot-note');
        tip.style.textAlign = 'center';
        tip.innerHTML = '结果只存在这个页面里，关掉就没了。<br>它不是定论，只是一面镜子。';
        root.appendChild(tip);

        /* 动画 */
        requestAnimationFrame(function () {
            animateRadar();
            root.querySelectorAll('.fill').forEach(function (n, i) {
                setTimeout(function () { n.style.width = n.dataset.w + '%'; }, 120 + i * 70);
            });
            root.querySelectorAll('.ab i').forEach(function (n, i) {
                setTimeout(function () { n.style.width = n.dataset.w + '%'; }, 320 + i * 90);
            });
        });
    }

    function copyShare() {
        var top = state.result.top, vec = state.result.vec, ex = state.result.ex;
        var f = top.f;
        var poles = DIMS.map(function (d, i) { return d.n + '：' + poleInfo(vec[i], d).t; }).join('　');
        var txt =
            '我在「同路人」测出的同频者是——' + f.name + '（' + f.era + '），契合度 ' + Math.round(top.score) + '%。\n' +
            '「' + f.title + '」\n' +
            f.feat.join(' · ') + '\n' +
            f.words + '\n' +
            '六维坐标　' + poles + '\n' +
            (top.balanced
                ? '你的六维非常均衡，没有哪一维明显压过其他。\n'
                : '你最突出的一处：' + ex[0].d.n + '·' + poleInfo(ex[0].v, ex[0].d).t + '。\n') +
            '—— 你的性格不是束缚，它只是还没找到坐标。';
        var done = function () { toast('结果文案已复制'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).then(done).catch(function () { fallbackCopy(txt, done); });
        } else fallbackCopy(txt, done);
    }

    function fallbackCopy(txt, cb) {
        var ta = document.createElement('textarea');
        ta.value = txt;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); cb(); } catch (e) { toast('复制失败，请手动选取'); }
        document.body.removeChild(ta);
    }

    function restart() {
        state.idx = 0;
        state.answers = new Array(24).fill(null);
        state.result = null;
        $('#scr-res').innerHTML = '';
        renderQuestion(0);
        show('scr-quiz');
    }

    /* =========================================================
       事件绑定
       ========================================================= */
    $('#btn-start').addEventListener('click', function () {
        renderQuestion(0);
        show('scr-quiz');
    });

    $('#btn-back').addEventListener('click', function () {
        if (state.idx > 0) { state.idx--; renderQuestion(-1); }
    });

    document.addEventListener('keydown', function (e) {
        if (!$('#scr-quiz').classList.contains('on')) return;
        if (e.key >= '1' && e.key <= '5') { choose(Number(e.key)); }
        else if (e.key === 'Backspace' && state.idx > 0) { e.preventDefault(); state.idx--; renderQuestion(-1); }
    });
})();
