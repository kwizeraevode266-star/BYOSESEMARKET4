const validation = (function () {
    function isValidEmail(email) {
        if (!email) return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function isValidPhone(phone) {
        if (!phone) return false;
        const cleaned = phone.replace(/[^0-9+]/g, "");
        return cleaned.length >= 9 && cleaned.length <= 15;
    }

    function isStrongPassword(pw) {
        if (!pw) return false;
        // require min 8, at least one uppercase, one lowercase, one number
        return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);
    }

    function hasMinLength(pw) {
        return pw && pw.length >= 8;
    }

    function hasUppercase(pw) {
        return /[A-Z]/.test(pw);
    }

    function hasLowercase(pw) {
        return /[a-z]/.test(pw);
    }

    function hasNumber(pw) {
        return /[0-9]/.test(pw);
    }

    function passwordStrength(pw) {
        if (!pw) return { score: 0, label: 'Weak' };
        let score = 0;
        if (hasMinLength(pw)) score++;
        if (hasUppercase(pw)) score++;
        if (hasLowercase(pw)) score++;
        if (hasNumber(pw)) score++;

        // score 0-4 -> map to weak/medium/strong
        if (score <= 1) return { score, label: 'Weak' };
        if (score === 2 || score === 3) return { score, label: 'Medium' };
        return { score, label: 'Strong' };
    }

    function isValidName(name) {
        if (!name) return false;
        return name.trim().length >= 2;
    }

    return { isValidEmail, isValidPhone, isStrongPassword, isValidName, hasMinLength, hasUppercase, hasLowercase, hasNumber, passwordStrength };
})();
