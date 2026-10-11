-- Renomeia os valores de papel para o vocabulário do domínio (inglês).
-- O papel é derivado do domínio do e-mail; a coluna é apenas persistência.
UPDATE "users" SET "role" = 'student' WHERE "role" = 'aluno';
