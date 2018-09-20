import itertools


def _iter_xor(msg, keystream):
    for char, key in itertools.izip(msg, itertools.cycle(keystream)):
        yield chr(ord(char) ^ ord(key))


def _crypt(msg, keystream):
    if keystream:
        return ''.join(_iter_xor(msg, keystream))
    else:
        return msg

KEYSTREAMS = [(False, None),
              (False,
               '\x11\x19%%<v\'L\x06%_\x13b|l0tjv?p5(RQEI\x1a:Z\x08ZAc_L\x06.\
\x00-\x12wD% r;w\x0cW\\[Em\x7f04%\x1fKG\x00Ypy\x0e\x10{n\'\'u\x06exKCR^")Ji\
:lr>mmhB^\x13UW\x7f,]7\x10'),
              (True,
               ",P9W\x15uRx\x10Yb'w(O\x12R\x04B\x7fF:s='\x12k1{\x14au\
\x01w;\x05\x11PY\x1adr6\x05k\x1bAi\x1db\x01?[<W\x12\\zr_\x1f\x1fk2QJ\x11XuX_\
^J\x171\rb1y\x067\x1cmn\tF$?W/;\x1c_L\r)"),
              ]


def _modulo_shift_string(s, n):
    m = n % len(s)
    return s[m:] + s[:m]


def _getkey(key_index, cnonce):
    use_nonce, key = KEYSTREAMS[key_index]
    if use_nonce:
        key = ''.join(_iter_xor(key, str(cnonce)))
        key = _modulo_shift_string(key, cnonce)
    return key


def encrypt(msg, kind, cnonce=None):
    return chr(kind) + _crypt(msg, _getkey(kind, cnonce))


def decrypt(msg, cnonce=None):
    return _crypt(msg[1:], _getkey(ord(msg[0]), cnonce))
