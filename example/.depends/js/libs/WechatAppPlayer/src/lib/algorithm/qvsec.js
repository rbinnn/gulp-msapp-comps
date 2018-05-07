var Qvsec = {};
Qvsec.ha = function (clss) {
	var k = [],
		i = 0;
	for (; i < 64;) {
		k[i] = 0 | (Math.abs(Math.sin(++i)) * 4294967296)
	}

	function add(x, y) {
		return (((x >> 1) + (y >> 1)) << 1) + (x & 1) + (y & 1)
	}

	var calcSHA = function (str) {
		var b, c, d, j, x = [],
			str2 = decodeURIComponent(encodeURI(str)),
			a = str2.length,
			h = [b = 1732584193, c = -271733879, ~b, ~c],
			i = 0;
		for (; i <= a;) x[i >> 2] |= (str2.charCodeAt(i) || 128) << 8 * (i++ % 4);
		x[str = (a + 8 >> 6) * clss + 14] = a * 8;
		i = 0;
		for (; i < str; i += clss) {
			a = h,
				j = 0;
			for (; j < 64;) {
				a = [d = a[3], add(b = a[1], (d = add(add(a[0], [b & (c = a[2]) | ~b & d, d & b | ~d & c, b ^ c ^ d, c ^ (b | ~d)][a = j >> 4]), add(k[j], x[[j, 5 * j + 1, 3 * j + 5, 7 * j][a] % clss + i]))) << (a = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, clss, 23, 6, 10, 15, 21][4 * a + j++ % 4]) | d >>> 32 - a), b, c]
			}
			for (j = 4; j;) h[--j] = add(h[j], a[j])
		}
		str = '';
		for (; j < 32;) str += ((h[j >> 3] >> ((1 ^ j++ & 7) * 4)) & 15).toString(clss);
		return str;
	};
	return calcSHA
}(16);


Qvsec.stringToHex = function (s) {
	var r = "";
	var hexes = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");
	for (var i = 0; i < s.length; i++) {
		r += hexes[s.charCodeAt(i) >> 4] + hexes[s.charCodeAt(i) & 0xf];
	}
	return r;
};

Qvsec.hexToString = function (h) {
	var r = "";
	for (var i = (h.substr(0, 2) == "0x") ? 2 : 0; i < h.length; i += 2) {
		r += String.fromCharCode(parseInt(h.substr(i, 2), 16));
	}
	return r;
};

Qvsec._Seed = "#$#@#*ad";

Qvsec.tempcalc = function (a, b) {
	var r = "";
	for (var i = 0; i < a.length; i++)
		r += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i % 4));
	return r;
};

Qvsec.u1 = function (a, b) {
	var r = "";
	for (var i = b; i < a.length; i += 2)
		r += a.charAt(i);
	return r;
};

Qvsec._urlStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

Qvsec.urlenc = function (input, sts, ts) {
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;
	while (i < input.length) {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);
		if (i == 15) {
			output = output + 'A';
			output = output + sts;
			output = output + ts;
		}
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}
		output = output +
			Qvsec._urlStr.charAt(enc1) + Qvsec._urlStr.charAt(enc2) +
			Qvsec._urlStr.charAt(enc3) + Qvsec._urlStr.charAt(enc4);
	}
	return output;
};

Qvsec.$xx = function (plt, vid, std, sts, ts) {
	var ts = ts || parseInt(+new Date / 1e3);
	return Qvsec.ha(plt + vid + ts + Qvsec._Seed + std + 'heherand');
};

Qvsec.$xxzb = function (plt, vid, std, sts, ts) {
	var ts = ts || parseInt(+new Date / 1e3);
	return Qvsec.ha(vid + 'tmp123' + plt + '#$$&c2*KA' + ts);
};

Qvsec.$xxf = function (plt, vid, std, sts, ts) {
	//300
	var ts = ts || parseInt(+new Date / 1e3);
	return Qvsec.ha(plt + 'ques' + ts + '*&%$(SD!L}' + vid + std);
};


Qvsec.$xxzbf = function (plt, vid, std, sts, ts) {
	//301
	var ts = ts || parseInt(+new Date / 1e3);
	return Qvsec.ha(vid + ts + '*#016' + plt + 'zput');
};
module.exports = Qvsec;